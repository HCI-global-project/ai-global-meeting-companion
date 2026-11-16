"""프로세스 메모리 저장소. Supabase 없이 로컬에서 돌리거나 테스트할 때 쓴다. 재시작하면 사라진다."""

import asyncio
from collections import defaultdict
from itertools import count

from ..domain.models import (
    LiveContext,
    MeetingNote,
    MeetingOutcome,
    OpinionSuggestion,
    Participant,
    Segment,
    SegmentDraft,
)


class InMemoryStore:
    def __init__(self) -> None:
        self._ids = count(1)
        self._lock = asyncio.Lock()
        self.segments: dict[str, list[Segment]] = defaultdict(list)
        self.participants: dict[str, dict[str, Participant]] = defaultdict(dict)
        self.primary_languages: dict[str, str] = {}
        self.contexts: dict[str, LiveContext] = {}
        self.outcomes: dict[str, MeetingOutcome] = {}
        self.suggestions: list[OpinionSuggestion] = []
        self.notes: list[MeetingNote] = []
        self.speakers: dict[str, dict[str, str]] = defaultdict(dict)

    async def append_segment(self, meeting_id: str, draft: SegmentDraft) -> Segment:
        async with self._lock:
            rows = self.segments[meeting_id]
            segment = Segment(
                **draft.model_dump(),
                id=str(next(self._ids)),
                meeting_id=meeting_id,
                sequence_index=len(rows),
            )
            rows.append(segment)
            return segment

    async def recent_segments(self, meeting_id: str, limit: int) -> list[Segment]:
        return self.segments[meeting_id][-limit:]

    def _find(self, segment_id: str) -> Segment | None:
        for rows in self.segments.values():
            for segment in rows:
                if segment.id == segment_id:
                    return segment
        return None

    async def save_correction(self, segment_id: str, corrected: str, ms: int) -> None:
        if segment := self._find(segment_id):
            segment.corrected_text = corrected

    async def save_translations(self, segment_id: str, translations: dict[str, str]) -> None:
        if segment := self._find(segment_id):
            segment.translations.update(translations)

    async def upsert_participant(self, meeting_id: str, participant: Participant) -> None:
        self.participants[meeting_id][participant.id] = participant

    async def list_participants(self, meeting_id: str) -> list[Participant]:
        return list(self.participants[meeting_id].values())

    async def primary_language(self, meeting_id: str) -> str | None:
        return self.primary_languages.get(meeting_id)

    async def save_context(self, meeting_id: str, context: LiveContext) -> None:
        self.contexts[meeting_id] = context

    async def load_context(self, meeting_id: str) -> LiveContext | None:
        return self.contexts.get(meeting_id)

    async def save_outcome(self, meeting_id: str, outcome: MeetingOutcome) -> None:
        self.outcomes[meeting_id] = outcome

    async def load_outcome(self, meeting_id: str) -> MeetingOutcome | None:
        return self.outcomes.get(meeting_id)

    async def save_suggestion(self, suggestion: OpinionSuggestion) -> None:
        self.suggestions.append(suggestion)

    async def save_note(self, note: MeetingNote) -> None:
        self.notes.append(note)

    async def save_speaker(self, meeting_id: str, speaker_key: str, participant_id: str | None) -> None:
        if participant_id is None:
            self.speakers[meeting_id].pop(speaker_key, None)
        else:
            self.speakers[meeting_id][speaker_key] = participant_id

    async def list_speakers(self, meeting_id: str) -> dict[str, str]:
        return dict(self.speakers[meeting_id])
