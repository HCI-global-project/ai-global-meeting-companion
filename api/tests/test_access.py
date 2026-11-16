"""접속 코드와 사용량 제한. 정상 사용은 막히지 않고, 넘으면 이유와 기다릴 시간을 알려 주는지 본다."""

import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.clients.fake import FakeLlmClient
from app.main import create_app
from app.services.rate_limit import RateLimiter
from app.store.memory import InMemoryStore

from .conftest import make_settings
from .test_api import WS, joined, receive_until

CODE = "loop-test"
HEADERS = {"X-Access-Code": CODE}


def make_client(**overrides) -> TestClient:
    app = create_app(make_settings(**overrides), llm=FakeLlmClient(), store=InMemoryStore())
    return TestClient(app)


# --- RateLimiter ---


class Clock:
    def __init__(self) -> None:
        self.now = 0.0

    def __call__(self) -> float:
        return self.now


def test_limiter_allows_up_to_limit_then_tells_wait_time():
    clock = Clock()
    limiter = RateLimiter(3, 60, clock)
    assert [limiter.hit("a") for _ in range(3)] == [None, None, None]
    clock.now = 20
    assert limiter.hit("a") == 40  # 첫 요청이 60초 창에서 빠질 때까지


def test_limiter_frees_up_after_window_and_counts_people_separately():
    clock = Clock()
    limiter = RateLimiter(1, 60, clock)
    assert limiter.hit("a") is None
    assert limiter.hit("b") is None  # 다른 참여자는 따로 센다
    assert limiter.hit("a") is not None
    clock.now = 60
    assert limiter.hit("a") is None


def test_zero_limit_means_no_limit():
    limiter = RateLimiter(0, 60)
    assert all(limiter.hit("a") is None for _ in range(1_000))


# --- 접속 코드 ---


def test_without_access_code_setting_everything_is_open():
    with make_client() as client, client.websocket_connect(f"{WS}?participantId=p1&name=A") as ws:
        joined(ws)


def test_http_requires_access_code():
    with make_client(access_code=CODE) as client:
        assert client.get("/api/meetings/room-1/state").status_code == 401
        assert client.get("/api/meetings/room-1/state", headers={"X-Access-Code": "wrong"}).status_code == 401
        assert client.get("/api/meetings/room-1/state", headers=HEADERS).status_code == 200
        assert client.post("/api/soniox/temporary-key").status_code == 401
        # 상태 확인은 코드 없이도 된다(배포 점검용)
        assert client.get("/api/health").json()["accessCodeRequired"] is True


def test_websocket_without_code_is_told_why_and_closed():
    with make_client(access_code=CODE) as client, client.websocket_connect(f"{WS}?participantId=p1&name=A") as ws:
        assert ws.receive_json()["code"] == "ACCESS_DENIED"
        with pytest.raises(WebSocketDisconnect) as closed:
            ws.receive_json()
        assert closed.value.code == 4403


def test_websocket_with_code_joins():
    with make_client(access_code=CODE) as client, client.websocket_connect(
        f"{WS}?participantId=p1&name=A&code={CODE}"
    ) as ws:
        joined(ws)


# --- 사용량 제한 ---


def test_messages_over_limit_get_429_with_retry_after():
    with make_client(rate_messages_per_min=2) as client, client.websocket_connect(f"{WS}?participantId=p1&name=A") as ws:
        joined(ws)
        send = lambda: client.post("/api/meetings/room-1/messages", json={"participantId": "p1", "text": "안녕"})  # noqa: E731
        assert send().status_code == 201
        assert send().status_code == 201
        blocked = send()
        assert blocked.status_code == 429
        assert 1 <= int(blocked.headers["Retry-After"]) <= 60


def test_segments_over_limit_still_reach_screens_but_skip_ai():
    with make_client(rate_segments_per_min=1) as client, client.websocket_connect(
        f"{WS}?participantId=p1&name=A&language=ko"
    ) as recorder, client.websocket_connect(f"{WS}?participantId=p2&name=B&language=en") as viewer:
        joined(recorder)
        joined(viewer)
        recorder.send_json({"type": "recording.start"})
        receive_until(recorder, "recording.changed")
        for text in ("첫 번째 발화", "두 번째 발화"):
            recorder.send_json({"type": "segment.final", "text": text, "speaker": "1", "language": "ko"})
            receive_until(recorder, "segment.saved")

        # 다른 화면은 두 발화를 모두 받는다. 번역은 한도 안의 첫 발화에만 붙는다
        finals: dict[str, str] = {}
        translated: set[str] = set()
        for _ in range(20):
            m = viewer.receive_json()
            if m["type"] == "transcript.final":
                finals[m["segmentId"]] = m["text"]
            if m["type"] == "translation.delta":
                translated.add(m["segmentId"])
            if len(finals) == 2 and translated:
                break
        assert list(finals.values()) == ["첫 번째 발화", "두 번째 발화"]
        first_id = next(iter(finals))
        assert translated == {first_id}
