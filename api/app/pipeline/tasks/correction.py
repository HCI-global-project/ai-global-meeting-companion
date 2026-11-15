"""전사 보정. 앞 발화와 회의 정보를 보고 STT 오인식만 고친다. 원문은 그대로 두고 따로 저장한다."""

import re

from ...clients.llm import LlmClient, StructuredRequest
from ...prompts.loader import join_or_none, or_none, render
from ..events import Event, SegmentCorrected, SegmentFinalized
from ..session import MeetingSession
from .base import MeetingTask

WINDOW_BEFORE = 4
SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {"corrected": {"type": "string"}},
    "required": ["corrected"],
}
# 앞 발화 형식을 따라 "▶" 나 "(화자 1) " 을 붙여 오는 경우가 있다.
LEADING_MARKS = re.compile(r"^\s*▶\s*")
LEADING_SPEAKER = re.compile(r"^\([^)]*\)\s*")


class CorrectionTask(MeetingTask):
    name = "correct"
    subscriptions = (SegmentFinalized,)

    def __init__(self, llm: LlmClient, enabled: bool = True):
        self._llm = llm
        self._enabled = enabled

    def accepts(self, session: MeetingSession, event: Event) -> bool:
        # 직접 입력한 글(채팅·의견)은 음성 인식을 거치지 않았다.
        return self._enabled and isinstance(event, SegmentFinalized) and event.segment.source == "speech"

    async def run(self, session: MeetingSession, events: list[Event]) -> None:
        for event in events:
            assert isinstance(event, SegmentFinalized)
            await self._correct(session, event)

    async def _correct(self, session: MeetingSession, event: SegmentFinalized) -> None:
        segment = event.segment
        response = await self._llm.generate(
            StructuredRequest(
                task=self.name,
                prompt=render(
                    "correct",
                    topic=or_none(session.topic or (session.context.current_topic if session.context else None)),
                    participants=join_or_none([p.name for p in session.participants.values()]),
                    terms=join_or_none(session.terms),
                    before=join_or_none([session.line(s) for s in session.before(segment, WINDOW_BEFORE)], "\n"),
                    focus=segment.text,
                ),
                schema=SCHEMA,
                max_output_tokens=min(2_000, 200 + len(segment.text) * 4),
                metadata={"text": segment.text},
            )
        )
        corrected = clean(response.data.get("corrected", ""), segment.text)
        if corrected == segment.text:
            return
        segment.corrected_text = corrected
        await session.store.save_correction(segment.id, corrected, response.ms)
        await session.bus.publish(SegmentCorrected(session.meeting_id, segment))


def clean(corrected: str, original: str) -> str:
    text = LEADING_MARKS.sub("", corrected.strip())
    if not original.startswith("("):
        text = LEADING_SPEAKER.sub("", text)
    return text.strip() or original
