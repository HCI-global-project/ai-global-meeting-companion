"""세션 이벤트를 프론트 스트림 이벤트(src/types/streaming.ts 의 IncomingTranscriptEvent) 모양으로 바꾼다."""

from datetime import datetime
from zoneinfo import ZoneInfo

from ..domain.models import Segment
from .events import (
    ContextUpdated,
    Event,
    OpinionSuggested,
    OutcomeUpdated,
    SegmentCorrected,
    SegmentFinalized,
    SegmentTranslated,
)
from .session import MeetingSession

# 서버가 UTC 로 돌아도 화면 시각은 회의 장소 기준으로 보낸다.
DISPLAY_TZ = ZoneInfo("Asia/Seoul")
# 프론트 TranscriptEntry.source 값
SOURCE = {"speech": "stream", "chat": "chat", "opinion": "opinion", "signal": "signal"}


def to_wire(session: MeetingSession, event: Event) -> list[dict]:
    match event:
        case SegmentFinalized(segment=segment):
            return [transcript_final(session, segment)]
        case SegmentCorrected(segment=segment):
            return [{"type": "transcript.corrected", "segmentId": segment.id, "text": segment.best_text}]
        case SegmentTranslated(segment=segment, translations=translations):
            return [
                {
                    "type": "translation.delta",
                    "segmentId": segment.id,
                    "targetLanguage": lang,
                    "translatedText": text,
                    "isFinal": True,
                }
                for lang, text in translations.items()
            ]
        case ContextUpdated(context=context):
            return [{"type": "context.updated", "context": context.dump()}]
        case OutcomeUpdated(outcome=outcome):
            return [{"type": "outcome.updated", "outcome": outcome.dump()}]
        case OpinionSuggested(suggestion=suggestion):
            return [{"type": "opinion.suggested", "suggestion": suggestion.dump()}]
    return []


def transcript_final(session: MeetingSession, segment: Segment) -> dict:
    return {
        "type": "transcript.final",
        "segmentId": segment.id,
        "speakerId": _speaker_id(segment),
        "speakerName": session.speaker_label(segment),
        "timestamp": _clock(segment.created_at),
        "createdAt": segment.created_at.isoformat(),
        "sourceLanguage": segment.language or "auto",
        "text": segment.best_text,
        "translations": segment.translations,
        "badgeVariant": "lavender" if segment.source in ("chat", "opinion") else "neutral",
        "source": SOURCE[segment.source],
        "isAnonymous": segment.is_anonymous,
    }


def _speaker_id(segment: Segment) -> str:
    if segment.is_anonymous:
        return "p-anonymous"
    if segment.participant_id:
        return segment.participant_id
    return f"speaker-{segment.speaker}" if segment.speaker else "speaker-unknown"


def _clock(at: datetime) -> str:
    return at.astimezone(DISPLAY_TZ).strftime("%H:%M")
