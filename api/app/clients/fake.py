"""키 없이 파이프라인 흐름을 확인하는 가짜 LLM. 작업마다 metadata 를 보고 그럴듯한 값을 돌려준다.

테스트에서는 handlers 로 작업별 응답을 바꿔 끼울 수 있다.
"""

import asyncio
from collections.abc import Callable
from typing import Any

from .llm import LlmError, StructuredRequest, StructuredResponse

Handler = Callable[[StructuredRequest], dict[str, Any]]

QUESTION_HINTS = ("?", "어떨까", "어때", "할까", "괜찮을까")
DECISION_HINTS = ("하기로", "확정", "정했", "결정")
ACTION_HINTS = ("까지", "맡을게", "제가 할게", "담당")


def _translate(req: StructuredRequest) -> dict:
    items: list[str] = req.metadata["items"]
    return {lang: [f"[{lang}] {text}" for text in items] for lang in req.metadata["targets"]}


def _correct(req: StructuredRequest) -> dict:
    return {"corrected": req.metadata["text"]}


def _live_context(req: StructuredRequest) -> dict:
    segments: list[dict] = req.metadata["segments"]
    texts = [s["text"] for s in segments]
    target = next((s for s in segments if any(h in s["text"] for h in QUESTION_HINTS)), None)
    return {
        "rollingSummary": " ".join(texts)[:300],
        "currentTopic": texts[0][:30] if texts else None,
        "keywords": sorted({w for t in texts for w in t.split() if len(w) >= 3})[:5],
        "openQuestions": [t for t in texts if "?" in t][:3],
        "suggestDecision": {
            "shouldSuggest": target is not None,
            "targetSegmentId": target["id"] if target else None,
            "importance": 80 if target else 10,
            "reason": "질문이나 제안이 나왔다" if target else "",
        },
    }


def _outcome(req: StructuredRequest) -> dict:
    ops = []
    for s in req.metadata["segments"]:
        text = s["text"]
        if any(h in text for h in DECISION_HINTS):
            ops.append({"op": "add", "id": None, "bucket": "decided", "text": text[:60], "owner": None})
        elif any(h in text for h in ACTION_HINTS):
            ops.append({"op": "add", "id": None, "bucket": "actionItems", "text": text[:60], "owner": None})
    return {"operations": ops}


def _opinion(req: StructuredRequest) -> dict:
    focus = req.metadata["focus"][:20]
    data: dict[str, Any] = {
        "agree": f"'{focus}' 좋다고 생각해요.",
        "disagree": f"'{focus}'는 조금 걱정돼요.",
        "alternative": f"'{focus}' 대신 다른 방법도 볼까요?",
    }
    for key in ("gloss", "english"):
        if key in req.schema.get("properties", {}):
            data[key] = {k: f"[{key}] {data[k]}" for k in ("agree", "disagree", "alternative")}
    return data


DEFAULT_HANDLERS: dict[str, Handler] = {
    "translate": _translate,
    "correct": _correct,
    "live_context": _live_context,
    "outcome": _outcome,
    "opinion": _opinion,
}


class FakeLlmClient:
    def __init__(self, handlers: dict[str, Handler] | None = None, delay_s: float = 0.0):
        self._handlers = {**DEFAULT_HANDLERS, **(handlers or {})}
        self._delay_s = delay_s
        self.calls: list[StructuredRequest] = []

    async def generate(self, request: StructuredRequest) -> StructuredResponse:
        self.calls.append(request)
        if self._delay_s:
            await asyncio.sleep(self._delay_s)
        handler = self._handlers.get(request.task)
        if handler is None:
            raise LlmError(f"FakeLlmClient: '{request.task}' 응답이 정의되지 않았습니다.")
        return StructuredResponse(data=handler(request), ms=0, model="fake")

    def calls_for(self, task: str) -> list[StructuredRequest]:
        return [c for c in self.calls if c.task == task]
