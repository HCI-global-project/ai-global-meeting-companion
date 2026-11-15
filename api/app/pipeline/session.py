"""회의 하나의 메모리 상태. 최근 발화 창·맥락·결과·참여자를 들고 있어서 작업이 매번 DB 를 다시 읽지 않는다."""

from collections import deque
from dataclasses import dataclass, field

from ..domain.models import LiveContext, MeetingOutcome, Participant, Segment, SegmentDraft
from ..services.languages import room_languages
from ..store.base import MeetingStore
from .background import BackgroundTasks
from .events import EventBus, ParticipantJoined, SegmentFinalized
from .scheduling import SchedulingPolicy

WINDOW_SIZE = 60


@dataclass
class MeetingSession:
    meeting_id: str
    primary_language: str
    store: MeetingStore
    participants: dict[str, Participant] = field(default_factory=dict)
    window: deque[Segment] = field(default_factory=lambda: deque(maxlen=WINDOW_SIZE))
    context: LiveContext | None = None
    outcome: MeetingOutcome | None = None
    # 녹음 기기가 알려 주는 회의 정보. 보정 프롬프트와 Soniox context 에 같이 쓴다.
    topic: str = ""
    terms: list[str] = field(default_factory=list)
    bus: EventBus = field(default_factory=EventBus)
    background: BackgroundTasks = field(default_factory=BackgroundTasks)
    policies: list[SchedulingPolicy] = field(default_factory=list)

    @property
    def languages(self) -> list[str]:
        return room_languages(list(self.participants.values()), self.primary_language)

    async def join(self, participant: Participant) -> None:
        self.participants[participant.id] = participant
        await self.store.upsert_participant(self.meeting_id, participant)
        await self.bus.publish(ParticipantJoined(self.meeting_id, participant))

    async def add_segment(self, draft: SegmentDraft) -> Segment:
        segment = await self.store.append_segment(self.meeting_id, draft)
        self.window.append(segment)
        await self.bus.publish(SegmentFinalized(self.meeting_id, segment))
        return segment

    def find_segment(self, segment_id: str) -> Segment | None:
        return next((s for s in self.window if s.id == segment_id), None)

    def before(self, segment: Segment, count: int) -> list[Segment]:
        earlier = [s for s in self.window if s.sequence_index < segment.sequence_index and s.source != "signal"]
        return earlier[-count:] if count else []

    def after(self, segment: Segment, count: int) -> list[Segment]:
        later = [s for s in self.window if s.sequence_index > segment.sequence_index and s.source != "signal"]
        return later[:count]

    def spoken_by(self, participant_id: str, count: int) -> list[Segment]:
        own = [s for s in self.window if s.participant_id == participant_id]
        return own[-count:]

    def speaker_label(self, segment: Segment) -> str:
        if segment.is_anonymous:
            return "익명"
        if segment.participant_id and (p := self.participants.get(segment.participant_id)):
            return p.name
        return segment.speaker

    def line(self, segment: Segment) -> str:
        label = self.speaker_label(segment)
        return f"({label}) {segment.best_text}" if label else segment.best_text

    async def flush(self) -> None:
        """밀린 작업을 끝까지 처리한다. 회의 종료와 테스트에서 쓴다."""
        for policy in self.policies:
            await policy.flush()
        await self.background.drain()
        for policy in self.policies:
            await policy.flush()
        await self.background.drain()

    async def close(self) -> None:
        await self.background.cancel_all()
