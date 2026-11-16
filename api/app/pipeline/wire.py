"""세션 이벤트를 프론트 스트림 이벤트(src/types/streaming.ts 의 IncomingTranscriptEvent) 모양으로 바꾼다."""

from datetime import datetime
from zoneinfo import ZoneInfo

from ..domain.models import Segment
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
from .speakers import speaker_number

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
        case ParticipantJoined(participant=participant):
            return [{"type": "participant.joined", "participant": participant.dump()}]
        case SpeakerAssigned(speaker_key=key, participant_id=participant_id):
            return [{"type": "speaker.assigned", "speakerKey": key, "participantId": participant_id}]
        case RecordingChanged(recorder_id=recorder_id):
            return [{"type": "recording.changed", "recorderId": recorder_id}]
    return []


def snapshot(session: MeetingSession) -> dict:
    """새로 들어온 화면이 지금 회의 상태를 한 번에 맞추도록 보낸다."""
    return {
        "type": "session.snapshot",
        "participants": [p.dump() for p in session.participants.values()],
        "speakers": dict(session.speakers.assignments),
        "recorderId": session.speakers.recorder_id,
    }


def transcript_final(session: MeetingSession, segment: Segment) -> dict:
    speaker_key = segment.speaker if segment.source == "speech" and segment.speaker else None
    return {
        "type": "transcript.final",
        "segmentId": segment.id,
        "speakerId": _speaker_id(segment),
        "speakerName": session.speaker_label(segment),
        # 화면이 화자 지정을 바로 반영하도록 키와 번호를 따로 준다. 이름은 participantId 로 찾는다
        "speakerKey": speaker_key,
        "speakerNumber": speaker_number(speaker_key) if speaker_key else None,
        "participantId": session.participant_of(segment),
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
