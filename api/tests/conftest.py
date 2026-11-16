import pytest

from app.clients.fake import FakeLlmClient
from app.config import Settings
from app.container import Container, build_container
from app.domain.models import Participant
from app.pipeline.events import Event
from app.pipeline.session import MeetingSession
from app.store.memory import InMemoryStore


def make_settings(**overrides) -> Settings:
    base = dict(
        ai_provider="fake",
        context_batch_size=2,
        context_max_wait_s=0.05,
        outcome_batch_size=2,
        outcome_max_wait_s=0.05,
        opinion_cooldown_s=0,
    )
    return Settings(_env_file=None, **{**base, **overrides})


@pytest.fixture
def llm() -> FakeLlmClient:
    return FakeLlmClient()


@pytest.fixture
def store() -> InMemoryStore:
    return InMemoryStore()


@pytest.fixture
async def container(llm, store):
    c = build_container(make_settings(), llm=llm, store=store)
    yield c
    await c.aclose()


def record(session: MeetingSession, *event_types: type[Event]) -> list[Event]:
    """세션 버스에 붙어 지정한 이벤트를 모은다."""
    seen: list[Event] = []
    for event_type in event_types:
        session.bus.subscribe(event_type, seen.append)
    return seen


async def room(c: Container, meeting_id: str = "room-1") -> MeetingSession:
    """한국인 1명, 영어권 1명, 일본인 1명이 있는 회의."""
    session = await c.registry.get(meeting_id)
    for p in (
        Participant(id="p-ko", name="민지", role="PM", language="ko"),
        Participant(id="p-en", name="Joe", role="Developer", language="en"),
        Participant(id="p-ja", name="Kenji", role="Designer", language="ja"),
    ):
        await session.join(p)
    return session
