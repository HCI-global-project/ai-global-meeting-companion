"""가짜 LLM 으로 파이프라인 전체 흐름을 확인한다: 발화 → 보정·번역 → 맥락 → 결과·의견 추천."""

from app.clients.fake import FakeLlmClient
from app.domain.models import SegmentDraft
from app.pipeline.events import ContextUpdated, OpinionSuggested, OutcomeUpdated, SegmentCorrected, SegmentTranslated

from .conftest import record, room


def speech(text: str, language: str = "ko", speaker: str = "1") -> SegmentDraft:
    return SegmentDraft(text=text, language=language, speaker=speaker)


async def test_korean_speech_is_translated_to_other_room_languages_only(container, llm):
    session = await room(container)
    seen = record(session, SegmentTranslated)
    segment = await session.add_segment(speech("오늘은 테스트 계획을 정해요"))
    await session.flush()

    assert segment.translations.keys() == {"en", "ja"}
    assert {e.segment.id for e in seen} == {segment.id}
    call = llm.calls_for("translate")[0]
    assert call.metadata["targets"] == ["en", "ja"]


async def test_english_code_switch_is_translated_to_korean_too(container, llm):
    session = await room(container)
    segment = await session.add_segment(speech("Can we push it to Friday?", language="en", speaker="2"))
    await session.flush()
    assert set(segment.translations) == {"ko", "ja"}


async def test_translation_includes_previous_lines_as_context(container, llm):
    session = await room(container)
    await session.add_segment(speech("프로토타입은 목요일까지 하죠"))
    await session.flush()
    await session.add_segment(speech("네 그걸로 가요"))
    await session.flush()
    last = llm.calls_for("translate")[-1]
    assert "프로토타입은 목요일까지 하죠" in last.prompt


async def test_correction_change_triggers_retranslation(store):
    from .conftest import make_settings
    from app.container import build_container

    llm = FakeLlmClient(handlers={"correct": lambda req: {"corrected": req.metadata["text"].replace("프로토 타입", "프로토타입")}})
    c = build_container(make_settings(correction_enabled=True), llm=llm, store=store)
    try:
        session = await room(c)
        corrected = record(session, SegmentCorrected)
        segment = await session.add_segment(speech("프로토 타입 먼저 봐요"))
        await session.flush()
        assert segment.corrected_text == "프로토타입 먼저 봐요"
        assert len(corrected) == 1
        assert segment.translations["en"] == "[en] 프로토타입 먼저 봐요"
    finally:
        await c.aclose()


async def test_chat_is_not_corrected(container, llm):
    session = await room(container)
    await session.add_segment(SegmentDraft(text="I agree", language="en", source="chat", participant_id="p-en"))
    await session.flush()
    assert llm.calls_for("correct") == []


async def test_context_is_batched_then_translated(container, llm):
    session = await room(container)
    updates = record(session, ContextUpdated)
    await session.add_segment(speech("오늘은 사용성 테스트 이야기를 해요"))
    await session.add_segment(speech("참가자는 몇 명이 좋을까요?"))
    await session.flush()

    assert len(llm.calls_for("live_context")) == 1  # 두 발화를 한 번에
    first, second = updates[0], updates[-1]
    assert first.decision is not None and first.decision.should_suggest
    assert second.decision is None and set(second.context.translations) == {"en", "ja"}
    assert session.context is second.context


async def test_opinion_is_made_per_participant_with_gloss(container, llm):
    session = await room(container)
    suggestions = record(session, OpinionSuggested)
    await session.add_segment(speech("참가자는 몇 명이 좋을까요?"))
    await session.add_segment(speech("다섯 명 정도 생각했어요"))
    await session.flush()

    by_person = {e.suggestion.participant_id: e.suggestion for e in suggestions}
    assert set(by_person) == {"p-ko", "p-en", "p-ja"}
    assert by_person["p-ko"].gloss == {}
    assert set(by_person["p-en"].gloss) == {"en"}
    assert set(by_person["p-ja"].gloss) == {"ja"}
    prompts = {c.metadata["participant"]: c.prompt for c in llm.calls_for("opinion")}
    assert "Developer" in prompts["p-en"] and "Designer" in prompts["p-ja"]


async def test_opinion_skips_the_sender_of_a_chat(container, llm):
    session = await room(container)
    suggestions = record(session, OpinionSuggested)
    await session.add_segment(SegmentDraft(text="금요일로 미루면 어떨까요?", language="ko", source="chat", participant_id="p-ko"))
    await session.add_segment(speech("음 생각해 볼게요"))
    await session.flush()
    assert {e.suggestion.participant_id for e in suggestions} == {"p-en", "p-ja"}


async def test_opinion_skips_the_assigned_speaker(container, llm):
    session = await room(container)
    suggestions = record(session, OpinionSuggested)
    await session.assign_speaker("r1:2", "p-en")
    await session.add_segment(speech("금요일로 미루면 어떨까요?", speaker="r1:2"))
    await session.add_segment(speech("음 생각해 볼게요", speaker="r1:1"))
    await session.flush()
    assert {e.suggestion.participant_id for e in suggestions} == {"p-ko", "p-ja"}
    # 프롬프트에도 지정된 이름이 들어간다
    assert any("(Joe) 금요일로" in call.prompt for call in llm.calls_for("opinion"))


async def test_opinion_is_dropped_if_speaker_is_assigned_while_generating(container, llm):
    session = await room(container)
    suggestions = record(session, OpinionSuggested)
    target = await session.add_segment(speech("금요일로 미루면 어떨까요?", speaker="r1:2"))
    task = container.opinion.request(session, session.participants["p-en"], target, source="manual")
    await session.assign_speaker("r1:2", "p-en")
    await task
    assert suggestions == []


async def test_new_recording_run_keeps_old_assignments_on_old_lines(container):
    session = await room(container)
    device = object()
    await session.start_recording("p-ko", device)
    first = await session.add_segment(speech("첫 회차", speaker=session.speakers.key("1")))
    await session.assign_speaker(first.speaker, "p-ja")
    await session.stop_recording(device)
    await session.start_recording("p-ko", device)
    second = await session.add_segment(speech("둘째 회차", speaker=session.speakers.key("1")))
    assert first.speaker != second.speaker
    assert session.speaker_label(first) == "Kenji"
    assert session.speaker_label(second) == "화자 1"


async def test_outcome_accumulates_with_stable_ids(container, store):
    session = await room(container)
    updates = record(session, OutcomeUpdated)
    await session.add_segment(speech("테스트 참가자는 5명으로 하기로 했어요"))
    await session.add_segment(speech("모집은 Kenji가 금요일까지 맡을게요"))
    await session.flush()
    outcome = updates[-1].outcome
    assert len(outcome.decided) == 1 and len(outcome.action_items) == 1
    first_id = outcome.decided[0].id
    assert set(outcome.decided[0].translations) == {"en", "ja"}

    await session.add_segment(speech("좋아요"))
    await session.add_segment(speech("다음 안건 볼까요"))
    await session.flush()
    assert session.outcome.decided[0].id == first_id
    assert store.outcomes["room-1"] == session.outcome


async def test_session_is_restored_from_store(container, store):
    session = await room(container)
    await session.add_segment(speech("첫 발화"))
    await session.flush()
    await container.registry.close_all()

    restored = await container.registry.get("room-1")
    assert restored is not session
    assert [s.text for s in restored.window] == ["첫 발화"]
    assert set(restored.participants) == {"p-ko", "p-en", "p-ja"}
