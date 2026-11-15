from fastapi import HTTPException, Request

from ..container import Container
from ..domain.models import Participant
from ..pipeline.session import MeetingSession


def container(request: Request) -> Container:
    return request.app.state.container


def participant_or_404(session: MeetingSession, participant_id: str) -> Participant:
    participant = session.participants.get(participant_id)
    if participant is None:
        raise HTTPException(404, f"참여자를 찾을 수 없습니다: {participant_id}")
    return participant
