"""번역 공용 서비스. 발화·맥락·결과·노트 번역이 모두 여기를 지난다.

방에 있는 언어 전부를 한 번의 호출로 받는다(언어별로 부르면 호출 수가 언어 수만큼 는다).
"""

import logging
from collections import OrderedDict
from typing import Protocol

from ..clients.llm import LlmClient, StructuredRequest
from ..domain.languages import language_name
from ..prompts.loader import join_or_none, render

log = logging.getLogger(__name__)

Translations = dict[str, list[str]]


class Translator(Protocol):
    async def translate(
        self, items: list[str], targets: list[str], context: list[str] | None = None
    ) -> Translations: ...


class LlmTranslator:
    def __init__(self, llm: LlmClient, glossary: list[str] | None = None):
        self._llm = llm
        self._glossary = glossary or []

    async def translate(
        self, items: list[str], targets: list[str], context: list[str] | None = None
    ) -> Translations:
        targets = list(dict.fromkeys(targets))
        if not items or not targets:
            return {}
        response = await self._llm.generate(
            StructuredRequest(
                task="translate",
                prompt=render(
                    "translate",
                    targets="\n".join(f"- {t}: {language_name(t)}" for t in targets),
                    glossary=f"- 용어집(그대로 쓸 표기): {', '.join(self._glossary)}\n" if self._glossary else "",
                    context=join_or_none(context or [], "\n"),
                    items="\n".join(f"{i + 1}. {text}" for i, text in enumerate(items)),
                ),
                schema=_schema(targets),
                max_output_tokens=min(6_000, 200 + sum(map(len, items)) * 4 * len(targets)),
                metadata={"items": items, "targets": targets},
            )
        )
        return {lang: _fit(response.data.get(lang, []), len(items), lang) for lang in targets}


class CachedTranslator:
    """맥락 없이 번역하는 짧은 문장("네", "좋아요")은 결과가 같아서 다시 부르지 않는다."""

    def __init__(self, inner: Translator, max_entries: int = 2_000):
        self._inner = inner
        self._max = max_entries
        self._cache: OrderedDict[tuple[str, str], str] = OrderedDict()

    async def translate(
        self, items: list[str], targets: list[str], context: list[str] | None = None
    ) -> Translations:
        if context:
            return await self._inner.translate(items, targets, context)

        missing_targets = [t for t in targets if any((t, i) not in self._cache for i in items)]
        if missing_targets:
            fresh = await self._inner.translate(items, missing_targets)
            for lang, texts in fresh.items():
                for item, text in zip(items, texts, strict=True):
                    self._remember((lang, item), text)
        return {t: [self._cache.get((t, i), "") for i in items] for t in targets}

    def _remember(self, key: tuple[str, str], value: str) -> None:
        self._cache[key] = value
        self._cache.move_to_end(key)
        while len(self._cache) > self._max:
            self._cache.popitem(last=False)


def _schema(targets: list[str]) -> dict:
    return {
        "type": "object",
        "additionalProperties": False,
        "properties": {t: {"type": "array", "items": {"type": "string"}} for t in targets},
        "required": targets,
    }


def _fit(texts: list[str], size: int, lang: str) -> list[str]:
    # 개수가 어긋나면 빈 번역으로 맞춘다. 화면은 원문만 보여 준다.
    if len(texts) != size:
        log.warning("번역 개수 불일치 (%s): %s != %s", lang, len(texts), size)
    return [str(t).strip() for t in texts[:size]] + [""] * max(0, size - len(texts))
