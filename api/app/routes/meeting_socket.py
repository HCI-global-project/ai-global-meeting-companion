"""회의 WebSocket. 참여자가 들어오고, 녹음 기기는 확정 발화를 보내고, 모두 처리 결과를 받는다.

연결 주소: /ws/meetings/{meetingId}?participantId=...&name=...&role=...&language=ko
"""

import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from ..container import Container
from ..domain.languages import normalize
from ..domain.models import Participant, SegmentDraft
from ..pipeline.hub import Connection
from ..pipeline.session import MeetingSession
from .schemas import ConfigureMessage, SegmentMessage

log = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws/meetings/{meeting_id}")
async def meeting_socket(socket: WebSocket, meeting_id: str) -> None:
    c: Container = socket.app.state.container
    query = socket.query_params
    await socket.accept()
    session = await c.registry.get(meeting_id)

    participant_id = query.get("participantId")
    if participant_id:
        await session.join(
            Participant(
                id=participant_id,
                name=query.get("name", ""),
                role=query.get("role", ""),
                language=normalize(query.get("language")) or session.primary_language,
                user_id=query.get("userId"),
            )
        )

    connection = Connection(socket, participant_id)
    c.hub.add(meeting_id, connection)
    await socket.send_json({"type": "status", "state": "listening"})
    try:
        while True:
            await _handle(session, socket, await socket.receive_json())
    except WebSocketDisconnect:
        pass
    finally:
        c.hub.remove(meeting_id, connection)


async def _handle(session: MeetingSession, socket: WebSocket, message: dict) -> None:
    kind = message.get("type")
    try:
        if kind == "segment.final":
            body = SegmentMessage.model_validate(message)
            if not body.text.strip():
                return
            segment = await session.add_segment(
                SegmentDraft(text=body.text.strip(), speaker=body.speaker, language=normalize(body.language))
            )
            await socket.send_json(
                {"type": "segment.saved", "clientSegmentId": body.client_segment_id, "segmentId": segment.id}
            )
        elif kind == "session.configure":
            body = ConfigureMessage.model_validate(message)
            session.topic, session.terms = body.topic, body.terms
        elif kind == "ping":
            await socket.send_json({"type": "pong"})
    except ValidationError as e:
        await socket.send_json({"type": "error", "code": "INVALID_MESSAGE", "message": str(e), "recoverable": True})
