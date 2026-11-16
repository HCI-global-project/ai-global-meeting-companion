"""회의 결과(정해진 것·할 일·아직 정해지지 않은 것) 누적. 맥락보다 천천히, 변경분만 합친다."""

from ...clients.llm import LlmClient, StructuredRequest
from ...domain.languages import language_name
from ...domain.models import MeetingOutcome, OutcomeItem
from ...prompts.loader import render
from ...services.languages import translation_targets
from ...services.outcome_merge import BUCKETS, Operation, apply_operations, describe
from ...services.translation import Translator
from ..background import BackgroundTasks
from ..events import Event, OutcomeUpdated, SegmentFinalized
from ..scheduling import Batched, Runner, SchedulingPolicy
from ..session import MeetingSession
from .base import MeetingTask

NULLABLE_STRING = {"type": ["string", "null"]}
SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "operations": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "op": {"type": "string", "enum": ["add", "update", "move", "remove"]},
                    "id": NULLABLE_STRING,
                    "bucket": {"type": ["string", "null"], "enum": [*BUCKETS, None]},
                    "text": NULLABLE_STRING,
                    "owner": NULLABLE_STRING,
                },
                "required": ["op", "id", "bucket", "text", "owner"],
            },
        }
    },
    "required": ["operations"],
}


class OutcomeTask(MeetingTask):
    name = "outcome"
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
        current = session.outcome or MeetingOutcome(language=session.primary_language)
        response = await self._llm.generate(
            StructuredRequest(
                task=self.name,
                prompt=render(
                    "outcome",
                    language=language_name(session.primary_language),
                    existing=describe(current),
                    segments="\n".join(session.line(s) for s in segments),
                ),
                schema=SCHEMA,
                max_output_tokens=1_200,
                metadata={"segments": [{"id": s.id, "text": s.best_text} for s in segments]},
            )
        )
        operations = [Operation.model_validate(op) for op in response.data.get("operations", [])]
        updated, changed = apply_operations(current, operations)
        if updated == current:
            return
        await self._translate_items(session, updated, changed)
        session.outcome = updated
        await session.store.save_outcome(session.meeting_id, updated)
        await session.bus.publish(OutcomeUpdated(session.meeting_id, updated))

    async def _translate_items(self, session: MeetingSession, outcome: MeetingOutcome, changed: set[str]) -> None:
        targets = translation_targets(session.languages, outcome.language)
        items: list[OutcomeItem] = [i for name in BUCKETS for i in outcome.bucket(name) if i.id in changed]
        if not targets or not items:
            return
        result = await self._translator.translate([i.text for i in items], targets)
        for index, item in enumerate(items):
            item.translations = {lang: values[index] for lang, values in result.items() if values[index]}
