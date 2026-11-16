"""LlmClient 를 감싸 호출마다 걸린 시간과 응답을 남긴다. 평가 보고서의 지연 시간·원 응답이 여기서 나온다."""

import time
from dataclasses import dataclass, field
from typing import Any

from app.clients.llm import LlmClient, StructuredRequest, StructuredResponse


@dataclass
class Call:
    task: str
    ms: int
    model: str = ""
    data: dict[str, Any] | None = None
    error: str | None = None


@dataclass
class RecordingLlmClient:
    inner: LlmClient
    calls: list[Call] = field(default_factory=list)

    async def generate(self, request: StructuredRequest) -> StructuredResponse:
        started = time.perf_counter()
        try:
            response = await self.inner.generate(request)
        except Exception as e:
            self.calls.append(Call(request.task, _elapsed(started), error=f"{type(e).__name__}: {e}"))
            raise
        # 재시도·대체 모델로 넘어간 시간까지 재려고 응답의 ms 대신 직접 잰다
        self.calls.append(Call(request.task, _elapsed(started), response.model, response.data))
        return response


def _elapsed(started: float) -> int:
    return round((time.perf_counter() - started) * 1000)
