from eval.cer import HANGUL, LATIN, cer, corpus_cer, normalize
from eval.segment_stats import stats


def test_normalize_ignores_spacing_punctuation_and_case():
    assert normalize("프로토 타입, OK?") == normalize("프로토타입 ok")


def test_cer_counts_character_edits():
    result = cer("프로토타입", "프로토 타잎")
    assert result.errors == 1 and result.length == 5


def test_language_split_catches_english_written_in_korean():
    ref, hyp = "deadline 은 금요일", "데드라인은 금요일"
    assert cer(ref, hyp, HANGUL).errors == 4  # 한글 쪽에 '데드라인' 네 글자가 끼어듦
    assert cer(ref, hyp, LATIN).cer == 1.0  # 영어가 통째로 사라짐


def test_corpus_cer_weights_by_length():
    assert corpus_cer([("가나다라", "가나다라"), ("마바", "마")]).cer == 1 / 6


def test_segment_stats():
    result = stats([10, 20, 30, 200])
    assert result["count"] == 4 and result["max"] == 200 and result["long_ratio"] == 0.25
