from app.clients.fake import FakeLlmClient
from app.services.languages import room_languages, translation_targets
from app.domain.models import Participant
from app.services.translation import CachedTranslator, LlmTranslator


async def test_one_call_returns_all_target_languages():
    llm = FakeLlmClient()
    result = await LlmTranslator(llm).translate(["안녕하세요"], ["en", "ja", "en"])
    assert result == {"en": ["[en] 안녕하세요"], "ja": ["[ja] 안녕하세요"]}
    assert len(llm.calls) == 1
    assert llm.calls[0].schema["required"] == ["en", "ja"]


async def test_mismatched_count_is_padded():
    llm = FakeLlmClient(handlers={"translate": lambda req: {"en": ["only one"]}})
    result = await LlmTranslator(llm).translate(["a", "b"], ["en"])
    assert result == {"en": ["only one", ""]}


async def test_cache_skips_repeated_short_phrases_without_context():
    llm = FakeLlmClient()
    translator = CachedTranslator(LlmTranslator(llm))
    await translator.translate(["네"], ["en"])
    await translator.translate(["네"], ["en"])
    assert len(llm.calls) == 1
    # 맥락이 붙은 요청은 결과가 달라질 수 있어 캐시하지 않는다
    await translator.translate(["네"], ["en"], context=["(민지) 이거 할까요?"])
    assert len(llm.calls) == 2


def test_room_languages_and_targets_include_korean_for_english_speech():
    participants = [Participant(id="a", name="a", language="en"), Participant(id="b", name="b", language="ja")]
    languages = room_languages(participants, "ko")
    assert languages == ["ko", "en", "ja"]
    # 외국인이 잠깐 영어로 말하면 한국인에게도 번역이 필요하다
    assert translation_targets(languages, "en") == ["ko", "ja"]
    assert translation_targets(languages, None) == ["ko", "en", "ja"]
