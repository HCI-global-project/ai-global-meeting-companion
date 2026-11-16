"""회의 WebSocket 연결 모음. 세션 이벤트를 연결된 화면에 보낸다.

배포에서는 Supabase Realtime 이 같은 역할을 한다. 이 허브는 Supabase 없이 로컬에서 돌릴 때와
녹음 기기에 처리 결과를 바로 돌려줄 때 쓴다. 의견 추천은 본인 연결에만 보낸다.
"""

import logging
from collections import defaultdict
from dataclasses import dataclass
from typing import Protocol

from .events import (
    ContextUpdated,
    Event,
    OpinionSuggested,
    OutcomeUpdated,
    ParticipantJoined,
    RecordingChanged,
    SegmentCorrected,
    SegmentFinalized,
    SegmentTranslated,
    SpeakerAssigned,
)
from .session import MeetingSession
from .wire import to_wire

log = logging.getLogger(__name__)

BROADCAST_EVENTS = (
    ParticipantJoined,
    SegmentFinalized,
    SegmentCorrected,
    SegmentTranslated,
    ContextUpdated,
    OutcomeUpdated,
    OpinionSuggested,
    SpeakerAssigned,
    RecordingChanged,
)


class Socket(Protocol):
    async def send_json(self, data: dict) -> None: ...


@dataclass(eq=False)
class Connection:
    socket: Socket
    participant_id: str | None


class ConnectionHub:
    def __init__(self) -> None:
        self._connections: dict[str, set[Connection]] = defaultdict(set)

    def attach(self, session: MeetingSession) -> None:
        async def forward(event: Event) -> None:
            await self.send(session, event)

        for event_type in BROADCAST_EVENTS:
            session.bus.subscribe(event_type, forward)

    def add(self, meeting_id: str, connection: Connection) -> None:
        self._connections[meeting_id].add(connection)

    def remove(self, meeting_id: str, connection: Connection) -> None:
        self._connections[meeting_id].discard(connection)

    async def send(self, session: MeetingSession, event: Event) -> None:
        recipient = event.suggestion.participant_id if isinstance(event, OpinionSuggested) else None
        for message in to_wire(session, event):
            for connection in list(self._connections[session.meeting_id]):
                if recipient and connection.participant_id != recipient:
                    continue
                try:
                    await connection.socket.send_json(message)
                except Exception:
                    log.info("끊긴 연결 정리 (%s)", session.meeting_id)
                    self.remove(session.meeting_id, connection)
