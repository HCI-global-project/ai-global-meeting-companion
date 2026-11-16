from app.pipeline.tasks.correction import clean


def test_clean_strips_markers_and_speaker_prefix():
    assert clean("▶ (화자 1) 프로토타입 먼저 봐요", "프로토 타입 먼저 봐요") == "프로토타입 먼저 봐요"


def test_clean_keeps_parenthesis_when_original_starts_with_one():
    assert clean("(웃음) 좋아요", "(웃음) 조아요") == "(웃음) 좋아요"


def test_clean_falls_back_to_original_when_empty():
    assert clean("  ", "원문") == "원문"


from app.pipeline.tasks.correction import plausible  # noqa: E402


def test_small_stt_fixes_are_accepted():
    assert plausible("프로토 타입 먼저 봐요", "프로토타입 먼저 봐요.", [])
    assert plausible("아주 작고 귀찮은 택", "아주 작고 귀찮은 탭", [])


def test_copying_a_previous_line_is_rejected():
    # 실제 회의에서 나온 경우: 보정 결과가 앞 발화를 그대로 베꼈다
    before = ["야, 아무 말이나 길게 해 봐.", "여기 보면 뭔가 큰 결정을"]
    assert not plausible("어 많은 사람들의 생각을 다 다시", "야, 아무 말이나 길게 해 봐.", before)


def test_rewrites_and_dropped_words_are_rejected():
    assert not plausible("결과인 경우가 많아 예를 들어", "결과가 많다.", [])
    assert not plausible("화면이 좀 더 필요하지 않을까 이런", "좀 더 큰 화면이 있으면 좋겠다는 의견입니다.", [])
    assert not plausible("그 정도 대답이라든가 이런 거", "", [])
