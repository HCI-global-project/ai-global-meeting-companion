"""작업별 실행기. 케이스 입력을 실제 작업 코드에 넣고, 검사하기 쉬운 평평한 dict 로 돌려준다.

프롬프트만 따로 부르지 않고 작업 코드를 그대로 돌린다. 응답 후처리(보정 거르기, 결과 합치기,
추천 대상 고르기)까지 합쳐서 사용자가 실제로 보게 되는 것을 평가하려는 것.
"""

from collections.abc import Awaitable, Callable
from typing import Any

from app.domain.models import OpinionSuggestion
from app.pipeline.events import ContextUpdated, OpinionSuggested, SegmentFinalized
from app.pipeline.tasks.correction import CorrectionTask
from app.pipeline.tasks.live_context import LiveContextTask
from app.pipeline.tasks.opinion import STANCES, OpinionTask
from app.pipeline.tasks.outcome import OutcomeTask
from app.services.outcome_merge import BUCKETS
from app.services.translation import LlmTranslator

from .fixtures import MEETING_ID, NullTranslator, add_segment, add_segments, build_session
from .recording import RecordingLlmClient

Output = dict[str, Any]
Runner = Callable[[dict[str, Any], RecordingLlmClient], Awaitable[Output]]


async def run_translate(case: dict[str, Any], llm: RecordingLlmClient) -> Output:
    """출력: {언어 코드: [번역문, ...]}"""
    translator = LlmTranslator(llm, case.get("glossary"))
    return await translator.translate(case["items"], case["targets"], case.get("context"))


async def run_correct(case: dict[str, Any], llm: RecordingLlmClient) -> Output:
    """출력: raw(모델이 낸 교정문), final(거르기를 지나 화면에 남는 글), accepted(교정이 반영됐는지)"""
    session = await build_session(case)
    await add_segments(session, case.get("before", []))
    segment = await add_segment(session, case["focus"])
    await CorrectionTask(llm, enabled=True).run(session, [SegmentFinalized(MEETING_ID, segment)])
    raw = (llm.calls[-1].data or {}).get("corrected", "") if llm.calls else ""
    return {"raw": raw, "final": segment.best_text, "accepted": segment.corrected_text is not None}


async def run_live_context(case: dict[str, Any], llm: RecordingLlmClient) -> Output:
    """출력: 맥락 필드 + 추천 판단. target 은 이번 묶음 안에서 몇 번째 발화(0부터)를 골랐는지."""
    session = await build_session(case)
    segments = await add_segments(session, case["segments"])
    updates: list[ContextUpdated] = []
    session.bus.subscribe(ContextUpdated, updates.append)

    task = LiveContextTask(llm, NullTranslator(), batch_size=len(segments), max_wait_s=0)
    await task.run(session, [SegmentFinalized(MEETING_ID, s) for s in segments])

    context, decision = updates[0].context, updates[0].decision
    ids = [s.id for s in segments]
    target = decision.target_segment_id if decision else None
    return {
        "topic": context.current_topic,
        "summary": context.rolling_summary,
        "keywords": context.keywords,
        "openQuestions": context.open_questions,
        "shouldSuggest": bool(decision and decision.should_suggest),
        "target": ids.index(target) if target in ids else None,
        "importance": decision.importance if decision else 0,
        "reason": decision.reason if decision else "",
    }


async def run_outcome(case: dict[str, Any], llm: RecordingLlmClient) -> Output:
    """출력: 칸별 항목 글. 할 일은 '글 (담당: 이름)' 으로 담당자까지 붙인다."""
    session = await build_session(case)
    segments = await add_segments(session, case["segments"])
    task = OutcomeTask(llm, NullTranslator(), batch_size=len(segments), max_wait_s=0)
    await task.run(session, [SegmentFinalized(MEETING_ID, s) for s in segments])

    output: Output = {"total": 0}
    if session.outcome is None:
        return {**output, **{name: [] for name in BUCKETS}}
    for name in BUCKETS:
        items = session.outcome.bucket(name)
        output[name] = [i.text + (f" (담당: {i.owner})" if i.owner else "") for i in items]
        output["total"] += len(items)
    return output


async def run_opinion(case: dict[str, Any], llm: RecordingLlmClient) -> Output:
    """출력: agree/disagree/alternative, all(세 문장 목록), gloss.*, english.*"""
    session = await build_session(case)
    await add_segments(session, case.get("before", []))
    target = await add_segment(session, case["focus"])
    await add_segments(session, case.get("after", []))
    suggestions: list[OpinionSuggestion] = []
    session.bus.subscribe(OpinionSuggested, lambda e: suggestions.append(e.suggestion))

    task = OpinionTask(llm, 0, 0, 1, extra_english=case.get("extraEnglish", False))
    await task.request(session, session.participants[case["recipient"]], target, source="manual")

    if not suggestions:
        return {}
    s = suggestions[0]
    gloss = next(iter(s.gloss.values()), {})
    output: Output = {stance: getattr(s, stance) for stance in STANCES}
    output["all"] = [getattr(s, stance) for stance in STANCES]
    if gloss:
        output["gloss"] = {**gloss, "all": [gloss.get(k, "") for k in STANCES]}
    if s.english:
        output["english"] = {**s.english, "all": [s.english.get(k, "") for k in STANCES]}
    return output


RUNNERS: dict[str, Runner] = {
    "translate": run_translate,
    "correct": run_correct,
    "live_context": run_live_context,
    "outcome": run_outcome,
    "opinion": run_opinion,
}
