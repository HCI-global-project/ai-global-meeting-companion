"""전사 보정. 앞 발화와 회의 정보를 보고 STT 오인식만 고친다. 원문은 그대로 두고 따로 저장한다."""

import re
from difflib import SequenceMatcher

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
# 오인식 교정은 몇 글자만 바꾼다. 이보다 많이 바뀌면 LLM 이 앞 발화를 베끼거나 말을 바꾼 것으로 보고 버린다
MIN_SIMILARITY = 0.6
# 원문보다 이만큼 이상 짧아졌으면 말을 빠뜨린 것이다
MIN_LENGTH_RATIO = 0.8
IGNORED = re.compile(r"[\s\W_]+", re.UNICODE)


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
        before = session.before(segment, WINDOW_BEFORE)
        response = await self._llm.generate(
            StructuredRequest(
                task=self.name,
                prompt=render(
                    "correct",
                    topic=or_none(session.topic or (session.context.current_topic if session.context else None)),
                    participants=join_or_none([p.name for p in session.participants.values()]),
                    terms=join_or_none(session.terms),
                    before=join_or_none([session.line(s) for s in before], "\n"),
                    focus=segment.text,
                ),
                schema=SCHEMA,
                max_output_tokens=min(2_000, 200 + len(segment.text) * 4),
                metadata={"text": segment.text},
            )
        )
        corrected = clean(response.data.get("corrected", ""), segment.text)
        if corrected == segment.text or not plausible(segment.text, corrected, [s.best_text for s in before]):
            return
        segment.corrected_text = corrected
        await session.store.save_correction(segment.id, corrected, response.ms)
        await session.bus.publish(SegmentCorrected(session.meeting_id, segment))


def clean(corrected: str, original: str) -> str:
    text = LEADING_MARKS.sub("", corrected.strip())
    if not original.startswith("("):
        text = LEADING_SPEAKER.sub("", text)
    return text.strip() or original


def _letters(text: str) -> str:
    return IGNORED.sub("", text)


def plausible(original: str, corrected: str, context: list[str]) -> bool:
    """띄어쓰기·문장부호를 빼고 비교해서, 원문을 조금 고친 정도인지 본다."""
    a, b = _letters(original), _letters(corrected)
    if not b:
        return False
    if any(b == _letters(line) for line in context):
        return False
    if len(b) < len(a) * MIN_LENGTH_RATIO:
        return False
    return SequenceMatcher(None, a, b).ratio() >= MIN_SIMILARITY
