"""참여자별 의견 추천(동의·반대·다른 의견).

'지금 의견을 낼 만한가'는 맥락 작업이 회의 전체에 대해 한 번 판단한다. 여기서는 그 판단을 받아
참여자마다 역할·언어·최근 발언에 맞춰 병렬로 만든다. 사람당 최소 간격을 두고, 새 추천이 시작되면
아직 만들던 이전 추천은 취소한다(화면은 가장 최근 것만 보여 준다).
"""

import asyncio
import time
import uuid

from ...clients.llm import LlmClient, StructuredRequest
from ...domain.languages import language_name
from ...domain.models import OpinionSuggestion, Participant, Segment
from ...prompts.loader import join_or_none, or_none, render
from ..events import ContextUpdated, Event, OpinionSuggested
from ..session import MeetingSession
from .base import MeetingTask

WINDOW_BEFORE = 4
WINDOW_AFTER = 1
STANCES = ("agree", "disagree", "alternative")
STANCE_OBJECT = {
    "type": "object",
    "additionalProperties": False,
    "properties": {s: {"type": "string"} for s in STANCES},
    "required": list(STANCES),
}


class OpinionTask(MeetingTask):
    name = "opinion"
    subscriptions = (ContextUpdated,)

    def __init__(
        self,
        llm: LlmClient,
        importance_threshold: int,
        cooldown_s: float,
        max_concurrency: int,
        extra_english: bool = False,
    ):
        self._llm = llm
        self._threshold = importance_threshold
        self._cooldown_s = cooldown_s
        self._semaphore = asyncio.Semaphore(max_concurrency)
        self._extra_english = extra_english
        self._last_at: dict[tuple[str, str], float] = {}
        self._in_flight: dict[tuple[str, str], asyncio.Task] = {}

    def accepts(self, session: MeetingSession, event: Event) -> bool:
        decision = event.decision if isinstance(event, ContextUpdated) else None
        return bool(decision and decision.should_suggest and decision.importance >= self._threshold)

    async def run(self, session: MeetingSession, events: list[Event]) -> None:
        for event in events:
            assert isinstance(event, ContextUpdated) and event.decision
            target = session.find_segment(event.decision.target_segment_id or "")
            if target is None:
                continue
            for participant in self._recipients(session, target):
                self.request(session, participant, target, source="auto")

    def request(self, session: MeetingSession, participant: Participant, target: Segment, source: str) -> asyncio.Task:
        key = (session.meeting_id, participant.id)
        if (previous := self._in_flight.get(key)) and not previous.done():
            previous.cancel()
        self._last_at[key] = time.monotonic()
        task = session.background.spawn(self._suggest(session, participant, target, source), name=f"opinion:{participant.id}")
        self._in_flight[key] = task
        return task

    def _recipients(self, session: MeetingSession, target: Segment) -> list[Participant]:
        now = time.monotonic()
        return [
            p
            for p in session.participants.values()
            # 그 말을 한 본인에게는 추천하지 않는다(채팅이거나, 화자가 누구인지 지정됐을 때)
            if p.id != session.participant_of(target)
            and now - self._last_at.get((session.meeting_id, p.id), -self._cooldown_s) >= self._cooldown_s
        ]

    async def _suggest(self, session: MeetingSession, participant: Participant, target: Segment, source: str) -> None:
        gloss_language = participant.language if participant.language != session.primary_language else None
        english = self._extra_english and "en" not in (session.primary_language, participant.language)
        async with self._semaphore:
            response = await self._llm.generate(
                StructuredRequest(
                    task=self.name,
                    prompt=self._prompt(session, participant, target, gloss_language, english),
                    schema=_schema(gloss_language is not None, english),
                    max_output_tokens=1_400 if gloss_language or english else 800,
                    metadata={"focus": target.best_text, "participant": participant.id},
                )
            )
        # 만드는 사이 이 화자가 본인으로 지정됐으면 보내지 않는다
        if session.participant_of(target) == participant.id:
            return
        data = response.data
        suggestion = OpinionSuggestion(
            id=f"s-{uuid.uuid4().hex[:10]}",
            meeting_id=session.meeting_id,
            participant_id=participant.id,
            user_id=participant.user_id,
            segment_id=target.id,
            target_text=target.best_text,
            source=source,
            agree=data["agree"],
            disagree=data["disagree"],
            alternative=data["alternative"],
            language=session.primary_language,
            gloss={gloss_language: data["gloss"]} if gloss_language and data.get("gloss") else {},
            english=data.get("english") if english else None,
        )
        await session.store.save_suggestion(suggestion)
        await session.bus.publish(OpinionSuggested(session.meeting_id, suggestion))

    def _prompt(
        self, session: MeetingSession, participant: Participant, target: Segment, gloss: str | None, english: bool
    ) -> str:
        context = session.context
        rules = []
        if gloss:
            rules.append(
                f"- 사용자의 모국어는 {language_name(gloss)} 입니다. 문장은 쉬운 표현으로 쓰고, "
                f"gloss 에 세 문장의 뜻을 {language_name(gloss)} 로 각각 번역해 넣으세요. 번역문만 넣으세요."
            )
        if english:
            rules.append("- english 에 같은 세 입장을 사용자가 영어로 바로 말할 수 있는 문장으로 넣으세요.")
        return render(
            "opinion",
            language=language_name(session.primary_language),
            extra_rules="\n".join(rules) + ("\n" if rules else ""),
            summary=or_none(context.rolling_summary if context else None),
            topic=or_none(context.current_topic if context else None),
            keywords=join_or_none(context.keywords if context else []),
            before=join_or_none([session.line(s) for s in session.before(target, WINDOW_BEFORE)], " / "),
            focus=session.line(target),
            after=join_or_none([session.line(s) for s in session.after(target, WINDOW_AFTER)], " / "),
            name=or_none(participant.name),
            role=or_none(participant.role),
            recent=join_or_none([s.best_text for s in session.spoken_by(participant.id, 3)], " / "),
        )


def _schema(with_gloss: bool, with_english: bool) -> dict:
    properties: dict = {s: {"type": "string"} for s in STANCES}
    if with_gloss:
        properties["gloss"] = STANCE_OBJECT
    if with_english:
        properties["english"] = STANCE_OBJECT
    return {
        "type": "object",
        "additionalProperties": False,
        "properties": properties,
        "required": list(properties),
    }
