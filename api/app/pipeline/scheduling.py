"""작업을 언제 실행할지 정하는 정책(Strategy).

- Immediate: 이벤트마다 바로 실행한다. 번역·보정처럼 발화 하나로 끝나는 일.
- Batched: 이벤트를 모아 개수나 시간이 차면 실행한다. 한 번에 하나만 돈다.
  맥락·회의 결과처럼 같은 상태를 이어서 갱신하는 일. lab 에서 DB lease(claim_live_context)로
  막던 동시 실행을 세션 메모리 안에서 막는다.
"""

import asyncio
from collections.abc import Awaitable, Callable
from typing import Protocol

from .background import BackgroundTasks
from .events import Event

Runner = Callable[[list[Event]], Awaitable[None]]


class SchedulingPolicy(Protocol):
    def offer(self, event: Event) -> None: ...

    async def flush(self) -> None:
        """남은 이벤트를 지금 처리한다(회의 종료·테스트)."""
        ...


class Immediate:
    def __init__(self, run: Runner, tasks: BackgroundTasks, name: str):
        self._run = run
        self._tasks = tasks
        self._name = name

    def offer(self, event: Event) -> None:
        self._tasks.spawn(self._run([event]), name=self._name)

    async def flush(self) -> None:
        return None


class Batched:
    def __init__(self, run: Runner, tasks: BackgroundTasks, name: str, min_items: int, max_wait_s: float):
        self._run = run
        self._tasks = tasks
        self._name = name
        self._min_items = max(1, min_items)
        self._max_wait_s = max_wait_s
        self._pending: list[Event] = []
        self._running = False
        self._timer: asyncio.Task | None = None

    @property
    def pending_count(self) -> int:
        return len(self._pending)

    def offer(self, event: Event) -> None:
        self._pending.append(event)
        if len(self._pending) >= self._min_items:
            self._kick()
        elif self._timer is None:
            self._timer = self._tasks.spawn(self._wait_then_kick(), name=f"{self._name}:timer")

    async def flush(self) -> None:
        self._cancel_timer()
        while self._running:
            await asyncio.sleep(0.01)
        if self._pending:
            await self._drain(force=True)

    def _kick(self) -> None:
        self._cancel_timer()
        if not self._running:
            self._running = True
            self._tasks.spawn(self._drain(force=False), name=self._name)

    async def _wait_then_kick(self) -> None:
        await asyncio.sleep(self._max_wait_s)
        self._timer = None
        if self._pending:
            if not self._running:
                self._running = True
                await self._drain(force=True)

    async def _drain(self, force: bool) -> None:
        self._running = True
        try:
            # 처리하는 동안 쌓인 발화는 이어서 처리한다. 덜 찼으면 타이머에 맡긴다.
            while self._pending and (force or len(self._pending) >= self._min_items):
                batch, self._pending = self._pending, []
                await self._run(batch)
                force = False
        finally:
            self._running = False
            if self._pending and self._timer is None:
                self._timer = self._tasks.spawn(self._wait_then_kick(), name=f"{self._name}:timer")

    def _cancel_timer(self) -> None:
        if self._timer is not None:
            if self._timer is not asyncio.current_task():
                self._timer.cancel()
            self._timer = None
