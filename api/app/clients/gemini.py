"""Gemini generateContent + responseJsonSchema 구조화 출력."""

import json
import time

import httpx

from .llm import LlmError, StructuredRequest, StructuredResponse

BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
RETRYABLE_STATUS = {429, 500, 503, 504}


class GeminiClient:
    def __init__(self, http: httpx.AsyncClient, api_key: str, model: str, thinking: str, timeout_s: float):
        self._http = http
        self._api_key = api_key
        self._model = model
        self._thinking = thinking
        self._timeout_s = timeout_s

    async def generate(self, request: StructuredRequest) -> StructuredResponse:
        started = time.perf_counter()
        try:
            res = await self._http.post(
                f"{BASE_URL}/{self._model}:generateContent",
                headers={"x-goog-api-key": self._api_key},
                json=self._body(request),
                timeout=self._timeout_s,
            )
        except httpx.TimeoutException as e:
            raise LlmError(f"{self._model} {self._timeout_s}s 안에 응답 없음", retryable=True, status=504) from e

        payload = res.json() if res.content else {}
        if res.status_code >= 300:
            message = payload.get("error", {}).get("message", "unknown")
            raise LlmError(
                f"Gemini {res.status_code}: {message}",
                retryable=res.status_code in RETRYABLE_STATUS,
                status=res.status_code,
            )
        return StructuredResponse(
            data=_parse(payload),
            ms=round((time.perf_counter() - started) * 1000),
            model=self._model,
        )

    def _body(self, request: StructuredRequest) -> dict:
        # 숫자면 thinkingBudget(2.5 계열), minimal/low 같은 단어면 thinkingLevel(3 계열)
        thinking = (
            {"thinkingBudget": int(self._thinking)}
            if self._thinking.lstrip("-").isdigit()
            else {"thinkingLevel": self._thinking}
        )
        return {
            "contents": [{"role": "user", "parts": [{"text": request.prompt}]}],
            "generationConfig": {
                "maxOutputTokens": request.max_output_tokens,
                "responseMimeType": "application/json",
                "responseJsonSchema": request.schema,
                "thinkingConfig": thinking,
            },
        }


def _parse(payload: dict) -> dict:
    candidate = (payload.get("candidates") or [{}])[0]
    parts = candidate.get("content", {}).get("parts", [])
    text = "".join(p.get("text", "") for p in parts if not p.get("thought"))
    if not text:
        raise LlmError(f"Gemini 응답에 텍스트가 없습니다. ({candidate.get('finishReason', 'no candidate')})")
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise LlmError(f"Gemini 응답이 JSON 이 아닙니다: {text[:200]}") from e
