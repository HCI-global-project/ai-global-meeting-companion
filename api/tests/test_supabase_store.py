"""Supabase 저장소가 마이그레이션과 맞는 요청을 보내는지 확인한다(실제 DB 없이)."""

import json

import httpx

from app.domain.models import OpinionSuggestion, SegmentDraft
from app.store.supabase import SupabaseStore


def store_with(handler) -> tuple[SupabaseStore, httpx.AsyncClient]:
    http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    return SupabaseStore(http, "https://x.supabase.co/", "service-key"), http


async def test_append_segment_calls_rpc_with_service_key():
    seen = {}

    def handler(req: httpx.Request) -> httpx.Response:
        seen["path"] = req.url.path
        seen["auth"] = req.headers["authorization"]
        seen["body"] = json.loads(req.content)
        return httpx.Response(
            200,
            json={
                "id": 7,
                "meeting_id": "m",
                "sequence_index": 0,
                "speaker": "",
                "content": "hi",
                "language": "en",
                "source": "chat",
                "participant_id": "p1",
                "is_anonymous": False,
                "corrected_content": None,
                "created_at": "2026-11-16T00:00:00+00:00",
            },
        )

    store, http = store_with(handler)
    async with http:
        segment = await store.append_segment(
            "m", SegmentDraft(text="hi", language="en", source="chat", participant_id="p1")
        )
    assert seen["path"] == "/rest/v1/rpc/append_segment"
    assert seen["auth"] == "Bearer service-key"
    assert seen["body"]["p_source"] == "chat" and seen["body"]["p_participant_id"] == "p1"
    assert segment.id == "7" and segment.source == "chat"


async def test_suggestion_upsert_uses_participant_conflict_key():
    seen = {}

    def handler(req: httpx.Request) -> httpx.Response:
        seen["query"] = req.url.params["on_conflict"]
        seen["prefer"] = req.headers["prefer"]
        seen["body"] = json.loads(req.content)
        return httpx.Response(201)

    store, http = store_with(handler)
    async with http:
        await store.save_suggestion(
            OpinionSuggestion(
                id="s1",
                meeting_id="m",
                participant_id="p1",
                user_id="u1",
                segment_id="7",
                target_text="t",
                source="auto",
                agree="a",
                disagree="d",
                alternative="x",
            )
        )
    assert seen["query"] == "meeting_id,participant_id,segment_id,source"
    assert "merge-duplicates" in seen["prefer"]
    assert seen["body"]["segment_id"] == 7 and seen["body"]["user_id"] == "u1"
