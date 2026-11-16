"""OpenAI Responses API + strict JSON Schema 구조화 출력."""

import json
import time

import httpx

from .llm import LlmError, StructuredRequest, StructuredResponse

URL = "https://api.openai.com/v1/responses"
RETRYABLE_STATUS = {429, 500, 502, 503, 504}


class OpenAiClient:
    def __init__(self, http: httpx.AsyncClient, api_key: str, model: str, reasoning_effort: str, timeout_s: float):
        self._http = http
        self._api_key = api_key
        self._model = model
        self._effort = reasoning_effort
        self._timeout_s = timeout_s

    async def generate(self, request: StructuredRequest) -> StructuredResponse:
        started = time.perf_counter()
        try:
            res = await self._http.post(
                URL,
                headers={"Authorization": f"Bearer {self._api_key}"},
                json={
                    "model": self._model,
                    "input": request.prompt,
                    "max_output_tokens": request.max_output_tokens,
                    "reasoning": {"effort": self._effort},
                    "text": {
                        "format": {
                            "type": "json_schema",
                            "name": request.task,
                            "strict": True,
                            "schema": request.schema,
                        }
                    },
                },
                timeout=self._timeout_s,
            )
        except httpx.TimeoutException as e:
            raise LlmError(f"{self._model} {self._timeout_s}s 안에 응답 없음", retryable=True, status=504) from e

        payload = res.json() if res.content else {}
        if res.status_code >= 300:
            message = payload.get("error", {}).get("message", "unknown")
            raise LlmError(
                f"OpenAI {res.status_code}: {message}",
                retryable=res.status_code in RETRYABLE_STATUS,
                status=res.status_code,
            )
        return StructuredResponse(
            data=_parse(payload),
            ms=round((time.perf_counter() - started) * 1000),
            model=self._model,
        )


def _parse(payload: dict) -> dict:
    # REST 응답에는 SDK 의 output_text 편의 필드가 없어 output[].content[] 를 직접 모은다.
    text = "".join(
        c.get("text", "")
        for item in payload.get("output", [])
        for c in item.get("content", []) or []
        if c.get("type") == "output_text"
    )
    if not text:
        raise LlmError("OpenAI 응답에 텍스트가 없습니다.")
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise LlmError(f"OpenAI 응답이 JSON 이 아닙니다: {text[:200]}") from e
