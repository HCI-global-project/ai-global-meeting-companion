"""LLM 평가 도구 자체의 테스트. 실제 LLM 은 부르지 않는다(Fake 로 배선만 확인)."""

import pytest

from app.clients.fake import FakeLlmClient
from eval.llm.checks import run_check, script_ratio, validate
from eval.llm.suite import load_cases, problems, run_case


def check(output: dict, **spec) -> bool:
    return run_check(output, spec).passed


def test_field_path_reads_list_items_and_joins_lists():
    out = {"en": ["Hello", "See you Thursday"]}
    assert check(out, check="contains_any", field="en.1", values=["thursday"])
    assert check(out, check="contains_all", field="en", values=["hello", "thursday"])
    assert not check(out, check="contains_any", field="en.5", values=["x"])  # 없는 필드는 실패


def test_script_detection():
    # 글자 수로 센다: 한글 8자, 영문 6자
    assert script_ratio("프로토타입 Soniox 정확도", "hangul") == pytest.approx(8 / 14)
    assert check({"t": "木曜日までに完成します"}, check="script", field="t", script="japanese")
    # 한자만 있으면 일본어가 아니라 중국어로 본다
    assert not check({"t": "星期四完成"}, check="script", field="t", script="japanese")
    assert check({"t": "စမ်းသပ်မှု ပါဝင်သူ ငါးဦး"}, check="script", field="t", script="myanmar", min_ratio=0.8)
    assert not check({"t": "ຜູ້ເຂົ້າຮ່ວມ"}, check="script", field="t", script="myanmar")  # 라오스 문자


def test_numbers_from_catches_invented_numbers():
    source = ["참가자는 5명이면 충분할 것 같아요."]
    assert check({"a": ["5명 좋아요."]}, check="numbers_from", field="a", source=source)
    assert not check({"a": ["7명은 어때요?"]}, check="numbers_from", field="a", source=source)


def test_any_item_needs_all_groups_in_one_item():
    items = ["참가자 모집 (담당: Joe)", "회의실 예약"]
    assert check({"x": items}, check="any_item", field="x", groups=[["모집"], ["Joe"]])
    assert not check({"x": items}, check="any_item", field="x", groups=[["예약"], ["Joe"]])


def test_equals_loose_ignores_spacing_and_punctuation():
    assert check({"f": "네, 그렇게 하죠"}, check="equals_loose", field="f", value="네 그렇게 하죠.")


def test_length_and_distinct_look_at_each_item():
    out = {"all": ["좋아요.", "걱정돼요.", "좋아요"]}
    assert not check(out, check="distinct", field="all")
    assert not check(out, check="length", field="all", min=4)


def test_validate_flags_typos():
    assert validate({"check": "contains_anyy", "field": "x"})
    assert validate({"check": "script", "field": "x", "script": "korean"})
    assert not validate({"check": "count", "field": "x", "max": 1})


def test_case_files_are_valid():
    cases = load_cases()
    assert not problems(cases)
    assert {c.task for c in cases} == {"translate", "correct", "live_context", "outcome", "opinion"}


@pytest.mark.parametrize("case", load_cases(), ids=lambda c: f"{c.task}/{c.id}")
async def test_every_case_runs_end_to_end_with_fake_llm(case):
    result = await run_case(case, FakeLlmClient())
    assert result.error is None, result.output
    assert len(result.checks) == len(case.checks)
    assert result.calls and all(c.task == case.task for c in result.calls)


def test_summary_separates_api_errors_and_records_answering_model():
    from eval.llm.recording import Call
    from eval.llm.report import summarize
    from eval.llm.suite import CaseResult

    ok = CaseResult("translate", "a", 1, calls=[Call("translate", 100, "fallback-model")])
    failed = CaseResult("translate", "b", 1, error="LlmError: 503", calls=[Call("translate", 50, error="503")])
    t = summarize([ok, failed])["translate"]
    assert t["passed"] == 1 and t["errors"] == 1
    assert t["models"] == {"fallback-model": 1}
    assert t["latency_ms"]["mean"] == 100  # 실패한 호출은 지연 시간에서 뺀다
