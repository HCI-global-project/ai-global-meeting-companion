"""LLM 출력 검사. 정답 문장과 똑같은지가 아니라, 꼭 지켜야 할 성질을 지켰는지 본다.

같은 뜻을 여러 표현으로 쓸 수 있어서 완전 일치는 쓰지 않는다. 대신
"목요일이 들어갔나", "미얀마 문자로 썼나", "없던 숫자를 지어내지 않았나" 처럼 어기면 안 되는 것만 잡는다.

케이스 JSON 의 checks 한 줄 = 검사 하나:
    {"check": "contains_any", "field": "en.0", "values": ["Thursday"]}
field 는 출력 dict 경로다. "en.0" 은 output["en"][0]. 목록이면 줄바꿈으로 이어서 본다.
"""

import re
import unicodedata
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

SCRIPTS: dict[str, str] = {
    "hangul": r"ᄀ-ᇿ㄰-㆏가-힣",
    "latin": r"a-zA-Z",
    "japanese": r"぀-ヿ一-鿿",
    "han": r"一-鿿",
    "cyrillic": r"Ѐ-ӿ",
    "myanmar": r"က-႟",
}
ANY_LETTER = re.compile("[" + "".join(SCRIPTS.values()) + "]")
KANA = re.compile(r"[぀-ヿ]")
NUMBER = re.compile(r"\d+")
LOOSE_IGNORED = re.compile(r"[\s\W_]+", re.UNICODE)


@dataclass(frozen=True)
class CheckResult:
    check: str
    field: str
    passed: bool
    detail: str = ""


class FieldMissing(Exception):
    pass


def resolve(output: dict[str, Any], path: str) -> Any:
    value: Any = output
    for part in path.split("."):
        if isinstance(value, list) and part.isdigit() and int(part) < len(value):
            value = value[int(part)]
        elif isinstance(value, dict) and part in value:
            value = value[part]
        else:
            raise FieldMissing(path)
    return value


def as_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return "\n".join(as_text(v) for v in value)
    return str(value)


def loose(text: str) -> str:
    """띄어쓰기·문장부호·대소문자를 무시하고 비교할 때."""
    return LOOSE_IGNORED.sub("", unicodedata.normalize("NFKC", text).lower())


def _has(text: str, needle: str) -> bool:
    return needle.lower() in text.lower()


# --- 검사 함수: (출력 값, 검사 설정) → (통과, 설명) ---


def _contains_any(value: Any, spec: dict) -> tuple[bool, str]:
    text = as_text(value)
    return any(_has(text, v) for v in spec["values"]), f"{spec['values']} 중 하나도 없음"


def _contains_all(value: Any, spec: dict) -> tuple[bool, str]:
    text = as_text(value)
    missing = [v for v in spec["values"] if not _has(text, v)]
    return not missing, f"없음: {missing}"


def _not_contains(value: Any, spec: dict) -> tuple[bool, str]:
    text = as_text(value)
    found = [v for v in spec["values"] if _has(text, v)]
    return not found, f"있으면 안 됨: {found}"


def _equals(value: Any, spec: dict) -> tuple[bool, str]:
    return value == spec["value"], f"기대 {spec['value']!r}"


def _equals_loose(value: Any, spec: dict) -> tuple[bool, str]:
    return loose(as_text(value)) == loose(spec["value"]), f"기대 {spec['value']!r}"


def _one_of(value: Any, spec: dict) -> tuple[bool, str]:
    return value in spec["values"], f"기대 {spec['values']} 중 하나"


def _range(value: Any, spec: dict) -> tuple[bool, str]:
    low, high = spec.get("min", float("-inf")), spec.get("max", float("inf"))
    ok = isinstance(value, int | float) and low <= value <= high
    return ok, f"기대 {spec.get('min', '')}~{spec.get('max', '')}"


def _count(value: Any, spec: dict) -> tuple[bool, str]:
    size = len(value) if isinstance(value, list) else -1
    return _range(size, spec)[0], f"개수 {size}, 기대 {spec.get('min', 0)}~{spec.get('max', '')}"


def _length(value: Any, spec: dict) -> tuple[bool, str]:
    """글자 수. 목록이면 항목마다 본다(예: 추천 문장 하나하나가 너무 길지 않은지)."""
    items = value if isinstance(value, list) else [value]
    sizes = [len(as_text(v)) for v in items]
    ok = all(_range(s, spec)[0] for s in sizes)
    return ok, f"글자 수 {sizes}, 기대 {spec.get('min', 0)}~{spec.get('max', '')}"


def script_ratio(text: str, script: str) -> float:
    letters = ANY_LETTER.findall(text)
    if not letters:
        return 0.0
    pattern = re.compile(f"[{SCRIPTS[script]}]")
    return sum(1 for c in letters if pattern.match(c)) / len(letters)


def _script(value: Any, spec: dict) -> tuple[bool, str]:
    """그 언어의 문자로 썼는지. 고유명사·영어 용어가 섞여도 되게 비율로 본다."""
    text = as_text(value)
    script, minimum = spec["script"], spec.get("min_ratio", 0.6)
    ratio = script_ratio(text, script)
    ok = ratio >= minimum
    # 일본어와 중국어는 한자를 같이 쓴다. 가나가 하나도 없으면 중국어로 쓴 것이다.
    if script == "japanese" and not KANA.search(text):
        ok = False
    return ok, f"{script} 비율 {ratio:.0%} (기준 {minimum:.0%})"


def _numbers_from(value: Any, spec: dict) -> tuple[bool, str]:
    """출력에 나온 숫자가 모두 입력에 있던 숫자인지. 날짜·인원을 지어내는 것을 잡는다."""
    allowed = set(NUMBER.findall(" ".join(spec["source"])))
    invented = sorted(set(NUMBER.findall(as_text(value))) - allowed)
    return not invented, f"입력에 없던 숫자: {invented}"


def _distinct(value: Any, spec: dict) -> tuple[bool, str]:
    """목록 항목이 서로 다른지. 동의·반대·대안이 같은 말이면 실패."""
    items = [loose(as_text(v)) for v in value] if isinstance(value, list) else []
    return len(set(items)) == len(items), "같은 문장이 있음"


def _any_item(value: Any, spec: dict) -> tuple[bool, str]:
    """목록 중 한 항목이 모든 묶음을 만족하는지. 묶음 안에서는 하나만 있으면 된다.

    예: [["모집"], ["Joe", "조"]] → '모집'과 'Joe'(또는 '조')가 같은 항목에 있어야 한다.
    """
    items = value if isinstance(value, list) else [value]
    ok = any(all(any(_has(as_text(i), v) for v in group) for group in spec["groups"]) for i in items)
    return ok, f"{spec['groups']} 를 모두 담은 항목 없음"


CHECKS: dict[str, Callable[[Any, dict], tuple[bool, str]]] = {
    "contains_any": _contains_any,
    "contains_all": _contains_all,
    "not_contains": _not_contains,
    "equals": _equals,
    "equals_loose": _equals_loose,
    "one_of": _one_of,
    "range": _range,
    "count": _count,
    "length": _length,
    "script": _script,
    "numbers_from": _numbers_from,
    "distinct": _distinct,
    "any_item": _any_item,
}
REQUIRED_KEYS: dict[str, tuple[str, ...]] = {
    "contains_any": ("values",),
    "contains_all": ("values",),
    "not_contains": ("values",),
    "equals": ("value",),
    "equals_loose": ("value",),
    "one_of": ("values",),
    "script": ("script",),
    "numbers_from": ("source",),
    "any_item": ("groups",),
}


def validate(spec: dict) -> list[str]:
    """케이스 파일 오타를 실행 전에 잡는다."""
    name = spec.get("check")
    if name not in CHECKS:
        return [f"모르는 검사: {name!r}"]
    problems = [f"{name}: '{key}' 가 없음" for key in ("field", *REQUIRED_KEYS.get(name, ())) if key not in spec]
    if name == "script" and spec.get("script") not in SCRIPTS:
        problems.append(f"모르는 문자 체계: {spec.get('script')!r}")
    return problems


def run_check(output: dict[str, Any], spec: dict) -> CheckResult:
    name, field = spec["check"], spec["field"]
    try:
        value = resolve(output, field)
    except FieldMissing:
        return CheckResult(name, field, False, "출력에 이 필드가 없음")
    passed, detail = CHECKS[name](value, spec)
    return CheckResult(name, field, passed, "" if passed else detail)
