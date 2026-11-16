"""회의 도메인 모델. JSON 으로 나갈 때는 프론트 타입(src/types/meeting.ts)과 같은 camelCase 를 쓴다."""

from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

SegmentSource = Literal["speech", "chat", "opinion", "signal"]
OutcomeBucket = Literal["decided", "actionItems", "undecided"]
OpinionStance = Literal["agree", "disagree", "alternative"]


def now() -> datetime:
    return datetime.now(UTC)


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    def dump(self) -> dict:
        return self.model_dump(by_alias=True, mode="json")


class Participant(CamelModel):
    id: str
    name: str
    role: str = ""
    language: str = "ko"
    # Supabase 익명 로그인 사용자. 있으면 추천을 RLS 로 본인에게만 보인다.
    user_id: str | None = None


class SegmentDraft(CamelModel):
    """저장 전 발화. 녹음 기기의 분절기나 채팅 입력에서 온다."""

    text: str
    speaker: str = ""
    # Soniox 언어 식별 결과. 직접 입력한 글은 모를 수 있다.
    language: str | None = None
    source: SegmentSource = "speech"
    # 채팅·의견처럼 누가 보냈는지 아는 경우. 익명 의견은 비워 둔다.
    participant_id: str | None = None
    is_anonymous: bool = False


class Segment(SegmentDraft):
    id: str
    meeting_id: str
    sequence_index: int
    corrected_text: str | None = None
    translations: dict[str, str] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=now)

    @property
    def best_text(self) -> str:
        return self.corrected_text or self.text


class SuggestDecision(CamelModel):
    should_suggest: bool = False
    target_segment_id: str | None = None
    importance: int = 0
    reason: str = ""


class ContextTranslation(CamelModel):
    topic: str = ""
    summary: str = ""


class LiveContext(CamelModel):
    current_topic: str | None = None
    rolling_summary: str = ""
    keywords: list[str] = Field(default_factory=list)
    open_questions: list[str] = Field(default_factory=list)
    # 결과물을 쓴 언어. 보는 사람 언어와 같으면 번역을 숨긴다.
    language: str = "ko"
    translations: dict[str, ContextTranslation] = Field(default_factory=dict)
    updated_at: datetime = Field(default_factory=now)


class OutcomeItem(CamelModel):
    # 순서가 바뀌어도 사용자가 바꾼 상태가 따라가도록 서버가 고정 id 를 준다.
    id: str
    text: str
    owner: str | None = None
    translations: dict[str, str] = Field(default_factory=dict)


class MeetingOutcome(CamelModel):
    decided: list[OutcomeItem] = Field(default_factory=list)
    action_items: list[OutcomeItem] = Field(default_factory=list)
    undecided: list[OutcomeItem] = Field(default_factory=list)
    language: str = "ko"
    updated_at: datetime = Field(default_factory=now)

    def bucket(self, name: OutcomeBucket) -> list[OutcomeItem]:
        return {"decided": self.decided, "actionItems": self.action_items, "undecided": self.undecided}[name]


class OpinionSuggestion(CamelModel):
    id: str
    meeting_id: str
    participant_id: str
    # RLS 로 본인에게만 보이게 할 때 쓴다. 화면으로 내보내지 않는다.
    user_id: str | None = Field(default=None, exclude=True)
    segment_id: str
    target_text: str
    source: Literal["auto", "manual"]
    agree: str
    disagree: str
    alternative: str
    language: str = "ko"
    # 참여자 언어로 옮긴 뜻: {언어: {stance: 문장}}
    gloss: dict[str, dict[OpinionStance, str]] = Field(default_factory=dict)
    # opinion_extra_english 조건일 때만 채운다
    english: dict[OpinionStance, str] | None = None
    created_at: datetime = Field(default_factory=now)


class MeetingNote(CamelModel):
    id: str
    meeting_id: str
    author: str
    content: str
    translated_content: dict[str, str] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=now)
