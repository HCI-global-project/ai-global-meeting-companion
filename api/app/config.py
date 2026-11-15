"""환경변수 설정. 실험 조건(feature flag)도 여기서 바꾼다."""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- LLM ---
    # fake 는 키 없이 흐름만 확인할 때 쓴다(테스트·로컬 데모).
    ai_provider: Literal["gemini", "openai", "fake"] = "fake"
    gemini_api_key: str | None = None
    openai_api_key: str | None = None
    # 2026-11 lab 측정: gemini-3.1-flash-lite 가 1~2초로 가장 빨랐다.
    gemini_model: str = "gemini-3.1-flash-lite"
    gemini_fallback_model: str = "gemini-3.5-flash-lite"
    gemini_thinking: str = "minimal"
    openai_model: str = "gpt-5.6-luna"
    openai_reasoning_effort: str = "low"
    llm_attempt_timeout_s: float = 8.0
    llm_max_attempts: int = 2

    # --- 외부 서비스 ---
    soniox_api_key: str | None = None
    # 비워 두면 메모리 저장소를 쓴다. Docker·Supabase 없이 바로 실행된다.
    supabase_url: str | None = None
    supabase_service_role_key: str | None = None

    # --- 회의 ---
    default_primary_language: str = "ko"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # --- 파이프라인 실험 조건 ---
    correction_enabled: bool = True
    # 번역에 같이 보낼 앞 발화 수
    translation_context_size: int = 3
    # 다음 발화가 오면 직전 발화 번역을 한 번 더 다듬는다(호출 수가 늘어난다)
    translation_refine_previous: bool = False
    context_batch_size: int = 3
    context_max_wait_s: float = 10.0
    outcome_batch_size: int = 6
    outcome_max_wait_s: float = 30.0
    opinion_importance_threshold: int = 60
    opinion_cooldown_s: float = 30.0
    opinion_max_concurrency: int = 4
    # 추천 문장을 주 언어 외에 영어로도 만든다(답답할 때 영어로 말하는 상황 실험)
    opinion_extra_english: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
