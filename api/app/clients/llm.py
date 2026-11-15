"""LLM 호출 공통 인터페이스. 작업(task)은 공급자를 모르고 이 인터페이스만 쓴다."""

from dataclasses import dataclass, field
from typing import Any, Protocol


@dataclass(frozen=True)
class StructuredRequest:
    """JSON Schema 로 모양이 정해진 응답을 요청한다."""

    task: str  # 로그·Fake 응답 구분용 (예: "translate")
    prompt: str
    schema: dict[str, Any]
    max_output_tokens: int = 1_200
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class StructuredResponse:
    data: dict[str, Any]
    ms: int
    model: str


class LlmError(Exception):
    def __init__(self, message: str, *, retryable: bool = False, status: int | None = None):
        super().__init__(message)
        self.retryable = retryable
        self.status = status


class LlmClient(Protocol):
    async def generate(self, request: StructuredRequest) -> StructuredResponse: ...
