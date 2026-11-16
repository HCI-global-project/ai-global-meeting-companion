"""실제 키 없이 HTTP 응답을 흉내 내 LLM 클라이언트·재시도·대체 모델을 확인한다."""

import json

import httpx
import pytest

from app.clients.gemini import GeminiClient
from app.clients.llm import LlmError, StructuredRequest
from app.clients.openai_client import OpenAiClient
from app.clients.resilience import FallbackLlmClient, RetryingLlmClient

REQUEST = StructuredRequest(task="translate", prompt="hi", schema={"type": "object"})


def http_with(handler) -> httpx.AsyncClient:
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


def gemini_ok(text: str) -> httpx.Response:
    return httpx.Response(200, json={"candidates": [{"content": {"parts": [{"text": "생각", "thought": True}, {"text": text}]}}]})


async def test_gemini_parses_json_and_skips_thought_parts():
    seen = {}

    def handler(req: httpx.Request) -> httpx.Response:
        seen["url"] = str(req.url)
        seen["body"] = json.loads(req.content)
        return gemini_ok('{"en": ["hello"]}')

    async with http_with(handler) as http:
        res = await GeminiClient(http, "k", "gemini-x", "minimal", 5).generate(REQUEST)
    assert res.data == {"en": ["hello"]}
    assert seen["url"].endswith("/gemini-x:generateContent")
    assert seen["body"]["generationConfig"]["thinkingConfig"] == {"thinkingLevel": "minimal"}


async def test_gemini_numeric_thinking_uses_budget():
    async with http_with(lambda req: gemini_ok("{}")) as http:
        client = GeminiClient(http, "k", "m", "0", 5)
        assert client._body(REQUEST)["generationConfig"]["thinkingConfig"] == {"thinkingBudget": 0}


async def test_gemini_overload_is_retryable_and_bad_request_is_not():
    async with http_with(lambda req: httpx.Response(503, json={"error": {"message": "busy"}})) as http:
        with pytest.raises(LlmError) as e:
            await GeminiClient(http, "k", "m", "minimal", 5).generate(REQUEST)
    assert e.value.retryable

    async with http_with(lambda req: httpx.Response(400, json={"error": {"message": "bad"}})) as http:
        with pytest.raises(LlmError) as e:
            await GeminiClient(http, "k", "m", "minimal", 5).generate(REQUEST)
    assert not e.value.retryable


async def test_openai_collects_output_text():
    payload = {"output": [{"content": [{"type": "output_text", "text": '{"ok": '}, {"type": "output_text", "text": "true}"}]}]}
    async with http_with(lambda req: httpx.Response(200, json=payload)) as http:
        res = await OpenAiClient(http, "k", "gpt-x", "low", 5).generate(REQUEST)
    assert res.data == {"ok": True}


class Flaky:
    def __init__(self, failures: int, retryable: bool = True):
        self.failures = failures
        self.retryable = retryable
        self.calls = 0

    async def generate(self, request):
        self.calls += 1
        if self.calls <= self.failures:
            raise LlmError("busy", retryable=self.retryable)
        from app.clients.llm import StructuredResponse

        return StructuredResponse(data={"ok": True}, ms=1, model="flaky")


async def test_retry_then_success():
    inner = Flaky(failures=1)
    res = await RetryingLlmClient(inner, max_attempts=2, base_delay_s=0).generate(REQUEST)
    assert res.data == {"ok": True} and inner.calls == 2


async def test_fallback_after_retries_exhausted_but_not_for_bad_requests():
    primary, fallback = Flaky(failures=5), Flaky(failures=0)
    client = FallbackLlmClient(RetryingLlmClient(primary, 2, 0), fallback)
    assert (await client.generate(REQUEST)).model == "flaky"
    assert primary.calls == 2 and fallback.calls == 1

    bad = FallbackLlmClient(Flaky(failures=5, retryable=False), Flaky(failures=0))
    with pytest.raises(LlmError):
        await bad.generate(REQUEST)
