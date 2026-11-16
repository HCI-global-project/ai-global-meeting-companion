"""회의별 세션을 만들고 찾는다. 서버가 재시작돼도 저장소에서 최근 상태를 읽어 이어 간다.

세션이 메모리에 있으므로 인스턴스는 한 대를 전제로 한다. 여러 대로 늘리려면 같은 회의를
같은 인스턴스로 보내는 라우팅이 필요하다.
"""

import asyncio
from collections.abc import Callable

from ..store.base import MeetingStore
from .pipeline import Pipeline
from .session import WINDOW_SIZE, MeetingSession

SessionHook = Callable[[MeetingSession], None]


class SessionRegistry:
    def __init__(self, store: MeetingStore, pipeline: Pipeline, default_primary_language: str):
        self._store = store
        self._pipeline = pipeline
        self._default_language = default_primary_language
        self._sessions: dict[str, MeetingSession] = {}
        self._lock = asyncio.Lock()
        # 화면 전송처럼 세션이 생길 때마다 붙일 구독자
        self._hooks: list[SessionHook] = []

    def on_create(self, hook: SessionHook) -> None:
        self._hooks.append(hook)

    def peek(self, meeting_id: str) -> MeetingSession | None:
        return self._sessions.get(meeting_id)

    async def get(self, meeting_id: str) -> MeetingSession:
        if session := self._sessions.get(meeting_id):
            return session
        async with self._lock:
            if session := self._sessions.get(meeting_id):
                return session
            session = await self._restore(meeting_id)
            # 화면 전송을 먼저 붙인다. 버스는 구독 순서대로 부르므로 원문이 번역보다 먼저 나간다.
            for hook in self._hooks:
                hook(session)
            self._pipeline.attach(session)
            self._sessions[meeting_id] = session
            return session

    async def _restore(self, meeting_id: str) -> MeetingSession:
        store = self._store
        primary, participants, segments, context, outcome, speakers = await asyncio.gather(
            store.primary_language(meeting_id),
            store.list_participants(meeting_id),
            store.recent_segments(meeting_id, WINDOW_SIZE),
            store.load_context(meeting_id),
            store.load_outcome(meeting_id),
            store.list_speakers(meeting_id),
        )
        session = MeetingSession(
            meeting_id=meeting_id,
            primary_language=primary or self._default_language,
            store=store,
            participants={p.id: p for p in participants},
            context=context,
            outcome=outcome,
        )
        session.window.extend(segments)
        session.speakers.assignments.update(speakers)
        return session

    async def close_all(self) -> None:
        for session in list(self._sessions.values()):
            await session.close()
        self._sessions.clear()
