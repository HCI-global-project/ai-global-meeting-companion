"""HTTP·WebSocket 요청 본문. 프론트와 같은 camelCase."""

from typing import Literal

from ..domain.models import CamelModel


class MessageRequest(CamelModel):
    participant_id: str
    text: str
    kind: Literal["chat", "opinion"] = "chat"
    anonymous: bool = False


class OpinionRequest(CamelModel):
    participant_id: str
    segment_id: str


class NoteRequest(CamelModel):
    author: str
    content: str
    # 노트를 쓴 사람의 언어. 그 언어로는 번역하지 않는다.
    language: str | None = None


class SegmentMessage(CamelModel):
    """녹음 기기 → 서버: 분절기가 확정한 발화."""

    type: Literal["segment.final"]
    text: str
    speaker: str = ""
    language: str | None = None
    client_segment_id: str | None = None


class ConfigureMessage(CamelModel):
    """녹음 기기 → 서버: 회의 정보(주제·용어). 보정 프롬프트에 쓴다."""

    type: Literal["session.configure"]
    topic: str = ""
    terms: list[str] = []
