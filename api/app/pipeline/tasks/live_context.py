"""회의 맥락(주제·키워드·요약·미해결 질문) 갱신과 '의견을 낼 만한 순간' 판단.

발화를 몇 개씩 묶어 한 번에 하나만 돈다. 결과는 먼저 보내고, 다른 언어 번역은 붙는 대로 다시 보낸다.
"""

from ...clients.llm import LlmClient, StructuredRequest
from ...domain.languages import language_name
from ...domain.models import ContextTranslation, LiveContext, SuggestDecision
from ...prompts.loader import join_or_none, or_none, render
from ...services.languages import translation_targets
from ...services.translation import Translator
from ..background import BackgroundTasks
from ..events import ContextUpdated, Event, SegmentFinalized
from ..scheduling import Batched, Runner, SchedulingPolicy
from ..session import MeetingSession
from .base import MeetingTask

STRINGS = {"type": "array", "items": {"type": "string"}}
SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "rollingSummary": {"type": "string"},
        "currentTopic": {"type": ["string", "null"]},
        "keywords": STRINGS,
        "openQuestions": STRINGS,
        "suggestDecision": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "shouldSuggest": {"type": "boolean"},
                "targetSegmentId": {"type": ["string", "null"]},
                "importance": {"type": "integer"},
                "reason": {"type": "string"},
            },
            "required": ["shouldSuggest", "targetSegmentId", "importance", "reason"],
        },
    },
    "required": ["rollingSummary", "currentTopic", "keywords", "openQuestions", "suggestDecision"],
}


class LiveContextTask(MeetingTask):
    name = "live_context"
    subscriptions = (SegmentFinalized,)

    def __init__(self, llm: LlmClient, translator: Translator, batch_size: int, max_wait_s: float):
        self._llm = llm
        self._translator = translator
        self._batch_size = batch_size
        self._max_wait_s = max_wait_s

    def accepts(self, session: MeetingSession, event: Event) -> bool:
        return isinstance(event, SegmentFinalized) and event.segment.source != "signal"

    def make_policy(self, run: Runner, tasks: BackgroundTasks) -> SchedulingPolicy:
        return Batched(run, tasks, self.name, self._batch_size, self._max_wait_s)

    async def run(self, session: MeetingSession, events: list[Event]) -> None:
        segments = [e.segment for e in events if isinstance(e, SegmentFinalized)]
        prev = session.context
        response = await self._llm.generate(
            StructuredRequest(
                task=self.name,
                prompt=render(
                    "live_context",
                    language=language_name(session.primary_language),
                    summary=or_none(prev.rolling_summary if prev else None),
                    topic=or_none(prev.current_topic if prev else None),
                    keywords=join_or_none(prev.keywords if prev else []),
                    questions=join_or_none(prev.open_questions if prev else []),
                    segments="\n".join(f"[segmentId={s.id}] {session.line(s)}" for s in segments),
                ),
                schema=SCHEMA,
                max_output_tokens=1_200,
                metadata={"segments": [{"id": s.id, "text": s.best_text} for s in segments]},
            )
        )
        data = response.data
        context = LiveContext(
            current_topic=data.get("currentTopic"),
            rolling_summary=data.get("rollingSummary", ""),
            keywords=data.get("keywords", [])[:6],
            open_questions=data.get("openQuestions", []),
            language=session.primary_language,
            # 번역이 붙기 전까지는 지난 번역을 지우지 않는다. 화면이 깜빡이지 않게.
            translations=prev.translations if prev else {},
        )
        decision = _decision(data.get("suggestDecision") or {}, {s.id for s in segments})
        session.context = context
        await session.bus.publish(ContextUpdated(session.meeting_id, context, decision))
        await self._attach_translations(session, context)

    async def _attach_translations(self, session: MeetingSession, context: LiveContext) -> None:
        targets = translation_targets(session.languages, context.language)
        if targets:
            result = await self._translator.translate([context.current_topic or "", context.rolling_summary], targets)
            context.translations = {
                lang: ContextTranslation(topic=values[0], summary=values[1]) for lang, values in result.items()
            }
        await session.store.save_context(session.meeting_id, context)
        if targets and session.context is context:
            await session.bus.publish(ContextUpdated(session.meeting_id, context))


def _decision(raw: dict, batch_ids: set[str]) -> SuggestDecision:
    target = raw.get("targetSegmentId")
    # 모델이 id 를 숫자로 돌려주는 경우가 있다.
    decision = SuggestDecision.model_validate({**raw, "targetSegmentId": None if target is None else str(target)})
    # 이번 묶음 밖의 발화를 가리키면 지난 판단을 다시 꺼낸 것이라 버린다.
    if not decision.should_suggest or decision.target_segment_id not in batch_ids:
        return SuggestDecision()
    decision.importance = max(0, min(100, decision.importance))
    return decision
