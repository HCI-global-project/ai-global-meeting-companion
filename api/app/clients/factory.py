"""설정에 맞는 LlmClient 를 조립한다. 공급자 교체는 AI_PROVIDER 하나로 끝난다."""

import httpx

from ..config import Settings
from .fake import FakeLlmClient
from .gemini import GeminiClient
from .llm import LlmClient
from .openai_client import OpenAiClient
from .resilience import FallbackLlmClient, RetryingLlmClient


def build_llm_client(settings: Settings, http: httpx.AsyncClient) -> LlmClient:
    if settings.ai_provider == "fake":
        return FakeLlmClient()

    if settings.ai_provider == "gemini":
        if not settings.gemini_api_key:
            raise ValueError("AI_PROVIDER=gemini 인데 GEMINI_API_KEY 가 없습니다.")

        def gemini(model: str) -> GeminiClient:
            return GeminiClient(
                http, settings.gemini_api_key, model, settings.gemini_thinking, settings.llm_attempt_timeout_s
            )

        primary = RetryingLlmClient(gemini(settings.gemini_model), settings.llm_max_attempts)
        return FallbackLlmClient(primary, gemini(settings.gemini_fallback_model))

    if not settings.openai_api_key:
        raise ValueError("AI_PROVIDER=openai 인데 OPENAI_API_KEY 가 없습니다.")
    client = OpenAiClient(
        http,
        settings.openai_api_key,
        settings.openai_model,
        settings.openai_reasoning_effort,
        settings.llm_attempt_timeout_s,
    )
    return RetryingLlmClient(client, settings.llm_max_attempts)
