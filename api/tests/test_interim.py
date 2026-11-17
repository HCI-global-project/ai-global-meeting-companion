"""확정 전 글자 전달과 임시 번역(실험). 꺼져 있으면 아무 일도 없고, 켜면 다른 화면에만 가는지 본다."""

import asyncio

from fastapi.testclient import TestClient

from app.clients.fake import FakeLlmClient
from app.domain.models import Participant, SegmentDraft
from app.main import create_app
from app.pipeline.hub import Connection
from app.pipeline.interim import InterimRelay
from app.pipeline.session import MeetingSession
from app.services.rate_limit import RateLimiter
from app.store.memory import InMemoryStore

from .conftest import make_settings
from .test_api import WS, joined, receive_until


def make_client(**overrides) -> TestClient:
    app = create_app(make_settings(**overrides), llm=FakeLlmClient(), store=InMemoryStore())
    return TestClient(app)


def start_recording(recorder) -> None:
    recorder.send_json({"type": "recording.start"})
    receive_until(recorder, "recording.changed")


def next_interim(ws, limit: int = 20) -> dict:
    return receive_until(ws, "transcript.interim", limit)[-1]


def assert_quiet(ws) -> None:
    """ping 의 답(pong)이 바로 오면 그 사이 다른 메시지는 없었다."""
    ws.send_json({"type": "ping"})
    assert ws.receive_json()["type"] == "pong"


def test_disabled_by_default_sends_nothing():
    with make_client() as client, client.websocket_connect(f"{WS}?participantId=p1&name=A&language=ko") as recorder, \
            client.websocket_connect(f"{WS}?participantId=p2&name=B&language=en") as viewer:
        joined(recorder), joined(viewer)
        start_recording(recorder)
        receive_until(viewer, "recording.changed")
        recorder.send_json({"type": "segment.interim", "text": "안녕하세요 여러분", "language": "ko"})
        assert_quiet(viewer)


def test_interim_words_and_translation_reach_other_screens_only():
    with make_client(interim_translation_enabled=True) as client, \
            client.websocket_connect(f"{WS}?participantId=p1&name=A&language=ko") as recorder, \
            client.websocket_connect(f"{WS}?participantId=p2&name=B&language=en") as viewer:
        joined(recorder), joined(viewer)
        start_recording(recorder)
        receive_until(viewer, "recording.changed")

        recorder.send_json({"type": "segment.interim", "text": "안녕하세요 여러분", "language": "ko"})
        first = next_interim(viewer)
        assert first["text"] == "안녕하세요 여러분" and first["translations"] == {}  # 원문은 바로 간다
        translated = next_interim(viewer)
        assert translated["translations"] == {"en": "[en] 안녕하세요 여러분"}
        assert translated["sourceLanguage"] == "ko"
        # 녹음 기기는 자기 화면에 이미 보여 주므로 받지 않는다
        assert_quiet(recorder)


def test_final_line_clears_interim_and_only_recorder_can_send():
    with make_client(interim_translation_enabled=True) as client, \
            client.websocket_connect(f"{WS}?participantId=p1&name=A&language=ko") as recorder, \
            client.websocket_connect(f"{WS}?participantId=p2&name=B&language=en") as viewer:
        joined(recorder), joined(viewer)
        start_recording(recorder)
        receive_until(viewer, "recording.changed")

        # 녹음 기기가 아닌 화면이 보낸 글자는 버린다
        viewer.send_json({"type": "segment.interim", "text": "가짜", "language": "ko"})
        assert_quiet(viewer)

        recorder.send_json({"type": "segment.interim", "text": "회의 시작할게요", "language": "ko"})
        next_interim(viewer)
        recorder.send_json({"type": "segment.final", "text": "회의 시작할게요", "speaker": "1", "language": "ko"})
        types = [m["type"] for m in receive_until(viewer, "transcript.final")]
        # 확정 줄이 오기 전에 임시 줄이 지워진다(같은 말이 두 번 보이지 않게)
        cleared = [m for m in types if m == "transcript.interim"]
        assert cleared, types


class FakeHub:
    def __init__(self) -> None:
        self.sent: list[dict] = []

    async def broadcast(self, meeting_id, message, exclude=None) -> None:
        self.sent.append(message)


class GatedTranslator:
    """번역을 바깥에서 풀어 줄 때까지 붙잡아 둔다. 그 사이 줄이 확정되는 상황을 만든다."""

    def __init__(self) -> None:
        self.release = asyncio.Event()

    async def translate(self, items, targets, context=None):
        await self.release.wait()
        return {t: [f"[{t}] {i}" for i in items] for t in targets}


async def test_late_translation_after_final_line_is_dropped():
    hub, translator = FakeHub(), GatedTranslator()
    relay = InterimRelay(hub, translator, enabled=True, limiter=RateLimiter(0, 60))
    session = MeetingSession("m", "ko", InMemoryStore())
    relay.attach(session)
    await session.join(Participant(id="p2", name="B", language="en"))
    recorder = Connection(socket=None, participant_id="p1")

    await relay.update(session, recorder, "확정 전 글자", "ko")
    await asyncio.sleep(0)  # 번역 시작
    await session.add_segment(SegmentDraft(text="확정 전 글자", speaker="1", language="ko"))  # 그 사이 확정됨
    translator.release.set()
    await session.background.drain()

    assert all(not m["translations"] for m in hub.sent), hub.sent
    assert hub.sent[-1]["text"] == ""  # 확정되면서 지워졌다
