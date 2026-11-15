"""HTTP·WebSocket 엔드포인트. 실제 서버처럼 lifespan 을 거쳐 가짜 LLM·메모리 저장소로 돈다."""

import pytest
from fastapi.testclient import TestClient

from app.clients.fake import FakeLlmClient
from app.main import create_app
from app.store.memory import InMemoryStore

from .conftest import make_settings

WS = "/ws/meetings/room-1"


@pytest.fixture
def store() -> InMemoryStore:
    return InMemoryStore()


@pytest.fixture
def client(store):
    app = create_app(make_settings(), llm=FakeLlmClient(), store=store)
    with TestClient(app) as c:
        yield c


def receive_until(ws, event_type: str, limit: int = 30) -> list[dict]:
    messages = []
    for _ in range(limit):
        message = ws.receive_json()
        messages.append(message)
        if message["type"] == event_type:
            return messages
    raise AssertionError(f"{event_type} 를 받지 못했다: {[m['type'] for m in messages]}")


def test_health(client):
    body = client.get("/api/health").json()
    assert body == {"ok": True, "aiProvider": "fake", "store": "memory", "sonioxConfigured": False}


def test_soniox_key_without_config_is_502(client):
    assert client.post("/api/soniox/temporary-key").status_code == 502


def test_recorder_segment_flows_back_as_frontend_events(client):
    with client.websocket_connect(f"{WS}?participantId=p-en&name=Joe&language=en") as ws:
        assert ws.receive_json() == {"type": "status", "state": "listening"}
        ws.send_json({"type": "segment.final", "text": "오늘 회의 시작할게요", "speaker": "1", "language": "ko", "clientSegmentId": "c1"})
        messages = receive_until(ws, "translation.delta")
        types = [m["type"] for m in messages]
        assert types.index("transcript.final") < types.index("translation.delta")
        final = next(m for m in messages if m["type"] == "transcript.final")
        assert final["text"] == "오늘 회의 시작할게요" and final["source"] == "stream"
        delta = next(m for m in messages if m["type"] == "translation.delta")
        assert delta["targetLanguage"] == "en"


def test_anonymous_opinion_does_not_store_sender(client, store):
    with client.websocket_connect(f"{WS}?participantId=p-ja&name=Kenji&language=ja") as ws:
        ws.receive_json()
        res = client.post(
            "/api/meetings/room-1/messages",
            json={"participantId": "p-ja", "text": "일정이 너무 빠듯해요", "kind": "opinion", "anonymous": True},
        )
        assert res.status_code == 201
        final = next(m for m in receive_until(ws, "transcript.final") if m["type"] == "transcript.final")
        assert final["isAnonymous"] is True and final["speakerId"] == "p-anonymous" and final["speakerName"] == "익명"
    saved = store.segments["room-1"][0]
    assert saved.participant_id is None and saved.speaker == ""


def test_message_from_unknown_participant_is_404(client):
    res = client.post("/api/meetings/room-x/messages", json={"participantId": "nobody", "text": "hi"})
    assert res.status_code == 404


def test_note_is_translated_except_author_language(client):
    with client.websocket_connect(f"{WS}?participantId=p-en&name=Joe&language=en"):
        pass
    res = client.post("/api/meetings/room-1/notes", json={"author": "Joe", "content": "Check the budget", "language": "en"})
    assert res.status_code == 201
    assert set(res.json()["translatedContent"]) == {"ko"}


def test_state_returns_recent_segments_for_late_joiners(client):
    with client.websocket_connect(f"{WS}?participantId=p-ko&name=민지&language=ko") as ws:
        ws.receive_json()
        ws.send_json({"type": "segment.final", "text": "첫 발화", "language": "ko"})
        receive_until(ws, "segment.saved")
    state = client.get("/api/meetings/room-1/state").json()
    assert state["primaryLanguage"] == "ko"
    assert [s["text"] for s in state["segments"]] == ["첫 발화"]


def test_invalid_socket_message_is_reported(client):
    with client.websocket_connect(WS) as ws:
        ws.receive_json()
        ws.send_json({"type": "segment.final"})
        assert ws.receive_json()["code"] == "INVALID_MESSAGE"
