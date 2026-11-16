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


def joined(ws) -> dict:
    """접속 직후 오는 status 와 스냅샷을 받고 스냅샷을 돌려준다."""
    assert ws.receive_json() == {"type": "status", "state": "listening"}
    snapshot = ws.receive_json()
    assert snapshot["type"] == "session.snapshot"
    return snapshot


def start_recording(ws) -> None:
    ws.send_json({"type": "recording.start"})
    receive_until(ws, "recording.changed")


def test_health(client):
    body = client.get("/api/health").json()
    assert body == {"ok": True, "aiProvider": "fake", "store": "memory", "sonioxConfigured": False}


def test_soniox_key_without_config_is_502(client):
    assert client.post("/api/soniox/temporary-key").status_code == 502


def test_recorder_segment_flows_back_as_frontend_events(client):
    with client.websocket_connect(f"{WS}?participantId=p-en&name=Joe&language=en") as ws:
        joined(ws)
        start_recording(ws)
        ws.send_json({"type": "segment.final", "text": "오늘 회의 시작할게요", "speaker": "1", "language": "ko", "clientSegmentId": "c1"})
        messages = receive_until(ws, "translation.delta")
        types = [m["type"] for m in messages]
        assert types.index("transcript.final") < types.index("translation.delta")
        final = next(m for m in messages if m["type"] == "transcript.final")
        assert final["text"] == "오늘 회의 시작할게요" and final["source"] == "stream"
        assert final["speakerNumber"] == "1" and final["speakerName"] == "화자 1" and final["participantId"] is None
        delta = next(m for m in messages if m["type"] == "translation.delta")
        assert delta["targetLanguage"] == "en"


def test_anonymous_opinion_does_not_store_sender(client, store):
    with client.websocket_connect(f"{WS}?participantId=p-ja&name=Kenji&language=ja") as ws:
        joined(ws)
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
        joined(ws)
        start_recording(ws)
        ws.send_json({"type": "segment.final", "text": "첫 발화", "language": "ko"})
        receive_until(ws, "segment.saved")
    state = client.get("/api/meetings/room-1/state").json()
    assert state["primaryLanguage"] == "ko"
    assert [s["text"] for s in state["segments"]] == ["첫 발화"]


def test_invalid_socket_message_is_reported(client):
    with client.websocket_connect(WS) as ws:
        joined(ws)
        ws.send_json({"type": "segment.final"})
        assert ws.receive_json()["code"] == "INVALID_MESSAGE"


def test_only_one_device_records_at_a_time(client):
    with client.websocket_connect(f"{WS}?participantId=p-ko&name=민지&language=ko") as recorder:
        joined(recorder)
        start_recording(recorder)
        with client.websocket_connect(f"{WS}?participantId=p-en&name=Joe&language=en") as other:
            assert joined(other)["recorderId"] == "p-ko"
            other.send_json({"type": "recording.start"})
            denied = receive_until(other, "recording.denied")[-1]
            assert denied["recorderName"] == "민지"
            other.send_json({"type": "segment.final", "text": "제 노트북에도 들어갔어요"})
            assert receive_until(other, "error")[-1]["code"] == "NOT_RECORDER"
    # 녹음 기기 연결이 끊기면 자리가 풀린다
    with client.websocket_connect(f"{WS}?participantId=p-en&name=Joe&language=en") as ws:
        assert joined(ws)["recorderId"] is None
        start_recording(ws)


def test_closing_a_duplicate_tab_keeps_the_recorder(client):
    """복제한 탭은 같은 참여자 id 를 갖는다. 그 탭이 닫혀도 녹음 중인 탭의 자리는 그대로다."""
    url = f"{WS}?participantId=p-ko&name=민지&language=ko"
    with client.websocket_connect(url) as recorder:
        joined(recorder)
        start_recording(recorder)
        with client.websocket_connect(url) as duplicate:
            joined(duplicate)
        recorder.send_json({"type": "segment.final", "text": "계속 녹음 중이에요", "language": "ko", "clientSegmentId": "c9"})
        saved = receive_until(recorder, "segment.saved")[-1]
        assert saved["clientSegmentId"] == "c9"


def test_reconnected_recorder_takes_the_slot_back(client):
    url = f"{WS}?participantId=p-ko&name=민지&language=ko"
    with client.websocket_connect(url) as old:
        joined(old)
        start_recording(old)
        with client.websocket_connect(url) as new:
            joined(new)
            new.send_json({"type": "segment.final", "text": "새 연결로 보냄", "language": "ko"})
            assert receive_until(new, "error")[-1]["code"] == "NOT_RECORDER"
            start_recording(new)
            new.send_json({"type": "segment.final", "text": "다시 맡고 보냄", "language": "ko", "clientSegmentId": "c2"})
            assert receive_until(new, "segment.saved")[-1]["clientSegmentId"] == "c2"


def test_assigned_speaker_is_named_on_every_screen(client, store):
    with client.websocket_connect(f"{WS}?participantId=p-ko&name=민지&language=ko") as recorder:
        joined(recorder)
        start_recording(recorder)
        with client.websocket_connect(f"{WS}?participantId=p-en&name=Joe&language=en") as viewer:
            joined(viewer)
            recorder.send_json({"type": "segment.final", "text": "배포는 금요일에 해요", "speaker": "2", "language": "ko"})
            final = next(m for m in receive_until(viewer, "transcript.final") if m["type"] == "transcript.final")

            viewer.send_json({"type": "speaker.assign", "speakerKey": final["speakerKey"], "participantId": "p-ko"})
            assigned = receive_until(recorder, "speaker.assigned")[-1]
            assert assigned == {"type": "speaker.assigned", "speakerKey": final["speakerKey"], "participantId": "p-ko"}

            recorder.send_json({"type": "segment.final", "text": "QA 는 수요일까지요", "speaker": "2", "language": "ko"})
            later = next(m for m in receive_until(viewer, "transcript.final") if m["type"] == "transcript.final")
            assert later["speakerName"] == "민지" and later["participantId"] == "p-ko"

            viewer.send_json({"type": "speaker.assign", "speakerKey": final["speakerKey"], "participantId": "nobody"})
            assert receive_until(viewer, "error")[-1]["code"] == "UNKNOWN_PARTICIPANT"
    assert store.speakers["room-1"] == {final["speakerKey"]: "p-ko"}
