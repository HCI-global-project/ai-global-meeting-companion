"""확정 전 글자를 다른 화면에 전하고, 켜져 있으면 임시 번역도 붙인다(실험: INTERIM_TRANSLATION_ENABLED).

Soniox 는 이어 말하는 동안 글자를 4~5초 늦게 확정한다. 확정된 줄만 번역하면 외국인 참여자는 그만큼
늦게 따라간다. 이 실험은 확정 전 글자를 계속 번역해서 보여 주고, 줄이 확정되면 정식 번역이 덮어쓴다.

- 저장하지 않는다. 화면에만 잠깐 보이는 값이다
- 방마다 번역은 한 번에 하나만 돈다. 도는 사이 새 글자가 오면 가장 최신 것만 다음에 번역한다
- 줄이 확정되면 세대를 올려, 그 전에 시작한 번역이 늦게 와도 버린다(이미 확정된 글자의 번역이라서)
"""

import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime

from ..services.languages import translation_targets
from ..services.rate_limit import RateLimiter
from ..services.translation import Translator
from .events import SegmentFinalized
from .hub import Connection, ConnectionHub
from .session import MeetingSession
from .wire import DISPLAY_TZ

log = logging.getLogger(__name__)

INTERIM_ID = "interim"
CONTEXT_LINES = 3


@dataclass
class _RoomState:
    generation: int = 0
    text: str = ""
    language: str | None = None
    # 아직 번역하지 않은 최신 글자가 있는지
    dirty: bool = False
    running: bool = False
    recorder: Connection | None = field(default=None, repr=False)


class InterimRelay:
    def __init__(self, hub: ConnectionHub, translator: Translator, enabled: bool, limiter: RateLimiter):
        self._hub = hub
        self._translator = translator
        self.enabled = enabled
        self._limiter = limiter
        self._rooms: dict[str, _RoomState] = {}

    async def update(self, session: MeetingSession, recorder: Connection, text: str, language: str | None) -> None:
        """녹음 기기가 보낸 확정 전 글자. 빈 글자면 다른 화면의 임시 줄을 지운다."""
        if not self.enabled:
            return
        room = self._room(session)
        room.recorder = recorder
        text = text.strip()
        if not text:
            await self.clear(session)
            return
        if text == room.text:
            return
        room.text, room.language = text, language
        await self._send(session, room, translations={})
        # 한도를 넘으면 원문만 전하고 번역은 건너뛴다(정식 번역은 줄이 확정되면 그대로 온다)
        if self._limiter.hit(recorder.participant_id or "recorder") is not None:
            return
        room.dirty = True
        if not room.running:
            room.running = True
            session.background.spawn(self._translate_latest(session, room), name=f"interim:{session.meeting_id}")

    async def clear(self, session: MeetingSession) -> None:
        room = self._room(session)
        room.generation += 1
        room.dirty = False
        if room.text:
            room.text = ""
            await self._send(session, room, translations={})

    def attach(self, session: MeetingSession) -> None:
        """회의가 생길 때 한 번 붙는다(registry.on_create)."""

        # 줄이 확정되면 그 글자는 정식 줄로 보인다. 임시 줄을 지워 같은 말이 두 번 보이지 않게 한다
        async def on_final(event: SegmentFinalized) -> None:
            if self.enabled and event.segment.source == "speech":
                await self.clear(session)

        session.bus.subscribe(SegmentFinalized, on_final)

    def _room(self, session: MeetingSession) -> _RoomState:
        return self._rooms.setdefault(session.meeting_id, _RoomState())

    async def _translate_latest(self, session: MeetingSession, room: _RoomState) -> None:
        try:
            while room.dirty:
                room.dirty = False
                generation, text, language = room.generation, room.text, room.language
                targets = translation_targets(session.languages, language)
                if not targets:
                    continue
                context = [session.line(s) for s in list(session.window)[-CONTEXT_LINES:]]
                try:
                    result = await self._translator.translate([text], targets, context)
                except Exception:
                    log.warning("임시 번역 실패 (%s)", session.meeting_id, exc_info=True)
                    continue
                # 번역하는 사이 줄이 확정됐거나 글자가 지워졌으면 이 번역은 낡았다
                if generation != room.generation or not room.text:
                    continue
                translations = {lang: values[0] for lang, values in result.items() if values and values[0]}
                # 더 새 글자가 와 있어도 보낸다. 앞부분 번역이라도 빨리 보이는 편이 낫다(다음 번역이 덮는다)
                await self._send(session, room, translations, text=text)
        finally:
            room.running = False

    async def _send(self, session: MeetingSession, room: _RoomState, translations: dict[str, str], text: str | None = None) -> None:
        message = {
            "type": "transcript.interim",
            "segmentId": INTERIM_ID,
            "speakerId": INTERIM_ID,
            "speakerName": "",
            "timestamp": datetime.now(UTC).astimezone(DISPLAY_TZ).strftime("%H:%M"),
            "sourceLanguage": room.language or "auto",
            "text": room.text if text is None else text,
            "translations": translations,
            "source": "stream",
        }
        # 녹음 기기는 자기 화면에 확정 전 글자를 이미 보여 준다
        await self._hub.broadcast(session.meeting_id, message, exclude=room.recorder)
