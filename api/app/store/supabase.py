"""Supabase(PostgREST) 저장소. 서버 키(secret 또는 예전 service role)로 쓰고, 화면에는 Realtime 으로 퍼진다.

테이블 구조는 supabase/migrations 를 따른다.
"""

from typing import Any

import httpx

from ..domain.models import (
    ContextTranslation,
    LiveContext,
    MeetingNote,
    MeetingOutcome,
    OpinionSuggestion,
    OutcomeItem,
    Participant,
    Segment,
    SegmentDraft,
)

UPSERT = {"Prefer": "resolution=merge-duplicates,return=minimal"}


def server_key_headers(key: str) -> dict[str, str]:
    """서버 키를 보내는 헤더.

    새 secret key(sb_secret_…)는 JWT 가 아니라서 apikey 헤더로만 보낸다. Authorization: Bearer 로 보내면
    Supabase 가 JWT 로 읽으려다 'Invalid JWT' 로 거절한다. 예전 service_role 키(JWT, eyJ…)는 둘 다 보낸다.
    """
    if key.startswith("sb_"):
        return {"apikey": key}
    return {"apikey": key, "Authorization": f"Bearer {key}"}


class SupabaseStore:
    def __init__(self, http: httpx.AsyncClient, url: str, service_role_key: str):
        self._http = http
        self._base = f"{url.rstrip('/')}/rest/v1"
        self._headers = server_key_headers(service_role_key)

    async def _request(self, method: str, path: str, **kwargs: Any) -> Any:
        headers = {**self._headers, **kwargs.pop("headers", {})}
        res = await self._http.request(method, f"{self._base}/{path}", headers=headers, timeout=10, **kwargs)
        res.raise_for_status()
        return res.json() if res.content else None

    # --- 발화 ---

    async def append_segment(self, meeting_id: str, draft: SegmentDraft) -> Segment:
        # 순번은 DB 함수가 회의 단위 advisory lock 으로 매긴다.
        row = await self._request(
            "POST",
            "rpc/append_segment",
            json={
                "p_meeting": meeting_id,
                "p_speaker": draft.speaker,
                "p_content": draft.text,
                "p_language": draft.language,
                "p_source": draft.source,
                "p_participant_id": draft.participant_id,
                "p_is_anonymous": draft.is_anonymous,
            },
        )
        return _segment(row)

    async def recent_segments(self, meeting_id: str, limit: int) -> list[Segment]:
        rows = await self._request(
            "GET",
            "transcript_segments",
            # 번역도 같이 읽는다. 서버가 재시작된 뒤 다시 붙은 화면이 번역 없는 줄을 받지 않게 한다
            params={
                "meeting_id": f"eq.{meeting_id}",
                "order": "sequence_index.desc",
                "limit": limit,
                "select": "*,segment_translations(language,content)",
            },
        )
        return [_segment(r) for r in reversed(rows)]

    async def save_correction(self, segment_id: str, corrected: str, ms: int) -> None:
        await self._request(
            "PATCH",
            "transcript_segments",
            params={"id": f"eq.{segment_id}"},
            json={"corrected_content": corrected, "corrected_ms": ms},
        )

    async def save_translations(self, segment_id: str, translations: dict[str, str]) -> None:
        rows = [{"segment_id": int(segment_id), "language": k, "content": v} for k, v in translations.items() if v]
        if rows:
            await self._request("POST", "segment_translations", json=rows, headers=UPSERT)

    # --- 참여자·회의 ---

    async def upsert_participant(self, meeting_id: str, participant: Participant) -> None:
        await self._request(
            "POST",
            "meeting_participants",
            json={
                "meeting_id": meeting_id,
                "participant_id": participant.id,
                "user_id": participant.user_id,
                "name": participant.name,
                "role": participant.role,
                "language": participant.language,
            },
            headers=UPSERT,
        )

    async def list_participants(self, meeting_id: str) -> list[Participant]:
        rows = await self._request("GET", "meeting_participants", params={"meeting_id": f"eq.{meeting_id}"})
        return [
            Participant(id=r["participant_id"], name=r["name"], role=r["role"], language=r["language"], user_id=r["user_id"])
            for r in rows
        ]

    async def primary_language(self, meeting_id: str) -> str | None:
        rows = await self._request(
            "GET", "meetings", params={"meeting_id": f"eq.{meeting_id}", "select": "primary_language"}
        )
        return rows[0]["primary_language"] if rows else None

    # --- 맥락·결과 ---

    async def save_context(self, meeting_id: str, context: LiveContext) -> None:
        await self._request(
            "POST",
            "live_context",
            json={
                "meeting_id": meeting_id,
                "rolling_summary": context.rolling_summary,
                "current_topic": context.current_topic,
                "keywords": context.keywords,
                "open_questions": context.open_questions,
                "language": context.language,
                "translations": {k: v.model_dump() for k, v in context.translations.items()},
                "updated_at": context.updated_at.isoformat(),
            },
            headers=UPSERT,
        )

    async def load_context(self, meeting_id: str) -> LiveContext | None:
        rows = await self._request("GET", "live_context", params={"meeting_id": f"eq.{meeting_id}"})
        if not rows:
            return None
        r = rows[0]
        return LiveContext(
            current_topic=r["current_topic"],
            rolling_summary=r["rolling_summary"],
            keywords=r["keywords"],
            open_questions=r["open_questions"],
            language=r.get("language") or "ko",
            translations={k: ContextTranslation(**v) for k, v in (r.get("translations") or {}).items()},
            updated_at=r["updated_at"],
        )

    async def save_outcome(self, meeting_id: str, outcome: MeetingOutcome) -> None:
        def items(bucket: list[OutcomeItem]) -> list[dict]:
            return [item.model_dump() for item in bucket]

        await self._request(
            "POST",
            "meeting_outcome",
            json={
                "meeting_id": meeting_id,
                "decided": items(outcome.decided),
                "action_items": items(outcome.action_items),
                "undecided": items(outcome.undecided),
                "language": outcome.language,
                "updated_at": outcome.updated_at.isoformat(),
            },
            headers=UPSERT,
        )

    async def load_outcome(self, meeting_id: str) -> MeetingOutcome | None:
        rows = await self._request("GET", "meeting_outcome", params={"meeting_id": f"eq.{meeting_id}"})
        if not rows:
            return None
        r = rows[0]
        return MeetingOutcome(
            decided=[OutcomeItem(**i) for i in r["decided"]],
            action_items=[OutcomeItem(**i) for i in r["action_items"]],
            undecided=[OutcomeItem(**i) for i in r["undecided"]],
            language=r["language"],
            updated_at=r["updated_at"],
        )

    # --- 추천·노트 ---

    async def save_suggestion(self, suggestion: OpinionSuggestion) -> None:
        await self._request(
            "POST",
            "opinion_suggestions",
            params={"on_conflict": "meeting_id,participant_id,segment_id,source"},
            json={
                "meeting_id": suggestion.meeting_id,
                "participant_id": suggestion.participant_id,
                "user_id": suggestion.user_id,
                "segment_id": int(suggestion.segment_id),
                "source": suggestion.source,
                "agree": suggestion.agree,
                "disagree": suggestion.disagree,
                "alternative": suggestion.alternative,
                "language": suggestion.language,
                "gloss": suggestion.gloss,
                "english": suggestion.english,
            },
            headers=UPSERT,
        )

    async def save_note(self, note: MeetingNote) -> None:
        await self._request(
            "POST",
            "meeting_notes",
            json={
                "meeting_id": note.meeting_id,
                "author": note.author,
                "content": note.content,
                "translations": note.translated_content,
            },
        )

    # --- 화자 지정 ---

    async def save_speaker(self, meeting_id: str, speaker_key: str, participant_id: str | None) -> None:
        # 해제도 행을 지우지 않고 participant_id 를 비운다. 누가 언제 바꿨는지 updated_at 으로 남는다
        await self._request(
            "POST",
            "meeting_speakers",
            json={"meeting_id": meeting_id, "speaker_key": speaker_key, "participant_id": participant_id},
            headers=UPSERT,
        )

    async def list_speakers(self, meeting_id: str) -> dict[str, str]:
        rows = await self._request(
            "GET",
            "meeting_speakers",
            params={"meeting_id": f"eq.{meeting_id}", "participant_id": "not.is.null"},
        )
        return {r["speaker_key"]: r["participant_id"] for r in rows}


def _segment(row: dict) -> Segment:
    return Segment(
        id=str(row["id"]),
        meeting_id=row["meeting_id"],
        sequence_index=row["sequence_index"],
        speaker=row.get("speaker") or "",
        text=row["content"],
        language=row.get("language"),
        source=row.get("source") or "speech",
        participant_id=row.get("participant_id"),
        is_anonymous=row.get("is_anonymous") or False,
        corrected_text=row.get("corrected_content"),
        created_at=row["created_at"],
        translations={t["language"]: t["content"] for t in row.get("segment_translations") or []},
    )
