"""LlmClient 를 감싸는 데코레이터. 과부하(429/503)는 흔하고 금방 풀려서 재시도 후 대체 모델로 넘긴다."""

import asyncio
import logging

from .llm import LlmClient, LlmError, StructuredRequest, StructuredResponse

log = logging.getLogger(__name__)


class RetryingLlmClient:
    def __init__(self, inner: LlmClient, max_attempts: int = 2, base_delay_s: float = 0.4):
        self._inner = inner
        self._max_attempts = max_attempts
        self._base_delay_s = base_delay_s

    async def generate(self, request: StructuredRequest) -> StructuredResponse:
        for attempt in range(1, self._max_attempts + 1):
            try:
                return await self._inner.generate(request)
            except LlmError as e:
                if not e.retryable or attempt == self._max_attempts:
                    raise
                log.warning("LLM 재시도 %s/%s (%s): %s", attempt, self._max_attempts, request.task, e)
                await asyncio.sleep(self._base_delay_s * attempt)
        raise AssertionError("unreachable")


class FallbackLlmClient:
    """기본 클라이언트가 재시도까지 실패하면 대체 클라이언트로 한 번 더 시도한다."""

    def __init__(self, primary: LlmClient, fallback: LlmClient):
        self._primary = primary
        self._fallback = fallback

    async def generate(self, request: StructuredRequest) -> StructuredResponse:
        try:
            return await self._primary.generate(request)
        except LlmError as e:
            if not e.retryable:
                raise
            log.warning("LLM 대체 모델로 전환 (%s): %s", request.task, e)
            return await self._fallback.generate(request)
