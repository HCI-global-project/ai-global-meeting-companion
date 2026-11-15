"""프롬프트에는 언어 코드 대신 이름을 넣는다. "my" 만 주면 미얀마어 대신 라오스어로 번역하는 일이 있었다."""

NAMES: dict[str, str] = {
    "ko": "Korean (한국어)",
    "en": "English",
    "ja": "Japanese (日本語)",
    "my": "Burmese / Myanmar language (မြန်မာဘာသာ, Myanmar script)",
    "ru": "Russian (Русский)",
    "es": "Spanish (Español)",
    "zh": "Simplified Chinese (简体中文)",
    "vi": "Vietnamese (Tiếng Việt)",
}


def language_name(code: str) -> str:
    return NAMES.get(code, code)


def normalize(code: str | None) -> str | None:
    """Soniox 는 'ko', 'en' 같은 ISO 639-1 코드를 준다. 지역 접미사는 버린다."""
    if not code:
        return None
    return code.split("-")[0].lower()
