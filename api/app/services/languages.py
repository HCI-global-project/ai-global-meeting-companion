"""누구에게 어떤 언어로 번역할지 정한다."""

from ..domain.models import Participant


def room_languages(participants: list[Participant], primary: str) -> list[str]:
    """방에 있는 언어. 주 언어를 맨 앞에 둔다."""
    return list(dict.fromkeys([primary, *(p.language for p in participants)]))


def translation_targets(languages: list[str], source: str | None) -> list[str]:
    """원문 언어를 뺀 나머지. 원문 언어를 모르면 전부 보내고 모델이 같은 언어는 그대로 둔다."""
    return [lang for lang in languages if lang != source]
