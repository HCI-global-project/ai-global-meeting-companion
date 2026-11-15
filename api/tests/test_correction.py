from app.pipeline.tasks.correction import clean


def test_clean_strips_markers_and_speaker_prefix():
    assert clean("▶ (화자 1) 프로토타입 먼저 봐요", "프로토 타입 먼저 봐요") == "프로토타입 먼저 봐요"


def test_clean_keeps_parenthesis_when_original_starts_with_one():
    assert clean("(웃음) 좋아요", "(웃음) 조아요") == "(웃음) 좋아요"


def test_clean_falls_back_to_original_when_empty():
    assert clean("  ", "원문") == "원문"
