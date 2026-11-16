"""세션이 띄운 비동기 작업을 모아 둔다. 실패는 로그로 남기고, 테스트와 종료 때는 끝날 때까지 기다린다."""

import asyncio
import logging
from collections.abc import Coroutine
from typing import Any

log = logging.getLogger(__name__)


class BackgroundTasks:
    def __init__(self) -> None:
        self._tasks: set[asyncio.Task] = set()

    def spawn(self, coro: Coroutine[Any, Any, Any], name: str = "") -> asyncio.Task:
        task = asyncio.create_task(coro, name=name or None)
        self._tasks.add(task)
        task.add_done_callback(self._done)
        return task

    def _done(self, task: asyncio.Task) -> None:
        self._tasks.discard(task)
        if task.cancelled():
            return
        if (error := task.exception()) is not None:
            log.error("백그라운드 작업 실패 (%s)", task.get_name(), exc_info=error)

    async def drain(self) -> None:
        """작업이 새 작업을 띄울 수 있어서 빌 때까지 반복해 기다린다."""
        while self._tasks:
            await asyncio.gather(*list(self._tasks), return_exceptions=True)

    async def cancel_all(self) -> None:
        for task in list(self._tasks):
            task.cancel()
        await asyncio.gather(*list(self._tasks), return_exceptions=True)
