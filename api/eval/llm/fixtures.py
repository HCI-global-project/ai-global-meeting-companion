"""케이스 입력으로 회의 세션을 만든다. 실제 서버와 같은 MeetingSession 을 쓰되 작업은 붙이지 않는다.

케이스의 발화는 이렇게 쓴다:
    {"speaker": "p-minji", "text": "...", "language": "ko"}
speaker 가 참여자 id 면 그 사람이 말한 것으로(화자 지정이 끝난 상태), 아니면 "화자 N" 으로 보인다.
"""

from typing import Any

from app.domain.models import (
    LiveContext,
    MeetingOutcome,
    OutcomeItem,
    Participant,
    Segment,
    SegmentDraft,
)
from app.pipeline.session import MeetingSession
from app.services.translation import Translations
from app.store.memory import InMemoryStore

MEETING_ID = "eval"
RUN_ID = "eval"


class NullTranslator:
    """맥락·결과 평가에서 번역 호출을 빼서 그 작업의 응답만 잰다. 번역은 따로 평가한다."""

    async def translate(self, items: list[str], targets: list[str], context: list[str] | None = None) -> Translations:
        return {}


async def build_session(spec: dict[str, Any]) -> MeetingSession:
    session = MeetingSession(MEETING_ID, spec.get("primaryLanguage", "ko"), InMemoryStore())
    session.topic = spec.get("topic", "")
    session.terms = list(spec.get("terms", []))
    for raw in spec.get("participants", []):
        await session.join(Participant.model_validate(raw))
    if raw_context := spec.get("context"):
        session.context = LiveContext.model_validate(raw_context)
    if raw_outcome := spec.get("outcome"):
        session.outcome = _outcome(raw_outcome, session.primary_language)
    return session


async def add_segments(session: MeetingSession, raws: list[dict[str, Any]]) -> list[Segment]:
    return [await add_segment(session, raw) for raw in raws]


async def add_segment(session: MeetingSession, raw: dict[str, Any]) -> Segment:
    speaker = raw.get("speaker", "1")
    key = f"{RUN_ID}:{speaker}"
    if speaker in session.participants:
        session.speakers.assignments[key] = speaker
    draft = SegmentDraft(
        text=raw["text"],
        speaker=key,
        language=raw.get("language", session.primary_language),
        source=raw.get("source", "speech"),
    )
    return await session.add_segment(draft)


def _outcome(raw: dict[str, Any], language: str) -> MeetingOutcome:
    def items(name: str) -> list[OutcomeItem]:
        return [OutcomeItem.model_validate(i) for i in raw.get(name, [])]

    return MeetingOutcome(
        decided=items("decided"),
        action_items=items("actionItems"),
        undecided=items("undecided"),
        language=language,
    )
