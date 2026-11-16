"""회의 WebSocket. 참여자가 들어오고, 녹음 기기 한 대가 확정 발화를 보내고, 모두 처리 결과를 받는다.

연결 주소: /ws/meetings/{meetingId}?participantId=...&name=...&role=...&language=ko

녹음은 한 번에 한 기기만 한다(recording.start). 같은 방에서 여러 기기가 녹음하면
같은 말이 여러 번 전사되기 때문이다. 녹음 기기 연결이 끊기면 자리가 풀린다.
"""

import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from ..container import Container
from ..domain.languages import normalize
from ..domain.models import Participant, SegmentDraft
from ..pipeline.hub import Connection
from ..pipeline.session import MeetingSession
from ..pipeline.wire import snapshot
from .schemas import AssignSpeakerMessage, ConfigureMessage, SegmentMessage

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

    # 다른 화면은 participant.joined 로, 이 화면은 스냅샷으로 참여자 목록을 맞춘다
    connection = Connection(socket, participant_id)
    c.hub.add(meeting_id, connection)
    await socket.send_json({"type": "status", "state": "listening"})
    await socket.send_json(snapshot(session))
    try:
        while True:
            await _handle(session, connection, await socket.receive_json())
    except WebSocketDisconnect:
        pass
    finally:
        c.hub.remove(meeting_id, connection)
        await session.stop_recording(connection)


async def _handle(session: MeetingSession, connection: Connection, message: dict) -> None:
    socket = connection.socket
    me = connection.participant_id
    kind = message.get("type")
    try:
        if kind == "segment.final":
            body = SegmentMessage.model_validate(message)
            if not session.speakers.is_recorder(connection):
                await _error(socket, "NOT_RECORDER", "녹음을 시작한 기기만 발화를 보낼 수 있어요.")
                return
            if not body.text.strip():
                return
            segment = await session.add_segment(
                SegmentDraft(
                    text=body.text.strip(),
                    speaker=session.speakers.key(body.speaker),
                    language=normalize(body.language),
                )
            )
            await socket.send_json(
                {"type": "segment.saved", "clientSegmentId": body.client_segment_id, "segmentId": segment.id}
            )
        elif kind == "recording.start":
            if not me:
                await _error(socket, "NOT_PARTICIPANT", "참여자로 들어와야 녹음할 수 있어요.")
            elif not await session.start_recording(me, connection):
                recorder = session.participants.get(session.speakers.recorder_id or "")
                await socket.send_json(
                    {"type": "recording.denied", "recorderId": session.speakers.recorder_id, "recorderName": recorder.name if recorder else ""}
                )
        elif kind == "recording.stop":
            await session.stop_recording(connection)
        elif kind == "speaker.assign":
            body = AssignSpeakerMessage.model_validate(message)
            try:
                await session.assign_speaker(body.speaker_key, body.participant_id)
            except KeyError:
                await _error(socket, "UNKNOWN_PARTICIPANT", "회의에 없는 참여자예요.")
        elif kind == "session.configure":
            body = ConfigureMessage.model_validate(message)
            session.topic, session.terms = body.topic, body.terms
        elif kind == "ping":
            await socket.send_json({"type": "pong"})
    except ValidationError as e:
        await _error(socket, "INVALID_MESSAGE", str(e))


async def _error(socket, code: str, message: str) -> None:
    await socket.send_json({"type": "error", "code": code, "message": message, "recoverable": True})
