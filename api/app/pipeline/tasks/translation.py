"""발화 번역. 짧게 끊긴 발화도 뜻이 통하도록 앞 발화를 맥락으로 같이 보낸다.

보정이 끝나 글이 바뀌면 다시 번역한다. 원문 번역을 먼저 보여 줘서 보정을 기다리지 않게 하려는 것.
"""

from ...domain.models import Segment
from ...services.languages import translation_targets
from ...services.translation import Translator
from ..events import Event, SegmentCorrected, SegmentFinalized, SegmentTranslated
from ..session import MeetingSession
from .base import MeetingTask


class TranslationTask(MeetingTask):
    name = "translate"
    subscriptions = (SegmentFinalized, SegmentCorrected)

    def __init__(self, translator: Translator, context_size: int = 3, refine_previous: bool = False):
        self._translator = translator
        self._context_size = context_size
        self._refine_previous = refine_previous

    def accepts(self, session: MeetingSession, event: Event) -> bool:
        return isinstance(event, SegmentFinalized | SegmentCorrected) and event.segment.source != "signal"

    async def run(self, session: MeetingSession, events: list[Event]) -> None:
        for event in events:
            assert isinstance(event, SegmentFinalized | SegmentCorrected)
            targets = translation_targets(session.languages, event.segment.language)
            if not targets:
                continue
            segments = self._segments_to_translate(session, event)
            await self._translate(session, segments, targets)

    def _segments_to_translate(self, session: MeetingSession, event: Event) -> list[Segment]:
        assert isinstance(event, SegmentFinalized | SegmentCorrected)
        segments = [event.segment]
        # 직전 발화는 뒤 문맥이 없을 때 번역됐다. 이번 발화와 같이 보내 한 번 더 다듬는다.
        if self._refine_previous and isinstance(event, SegmentFinalized):
            previous = session.before(event.segment, 1)
            if previous and previous[0].language == event.segment.language:
                segments = [previous[0], event.segment]
        return segments

    async def _translate(self, session: MeetingSession, segments: list[Segment], targets: list[str]) -> None:
        texts = [s.best_text for s in segments]
        context = [session.line(s) for s in session.before(segments[0], self._context_size)]
        result = await self._translator.translate(texts, targets, context)

        for i, segment in enumerate(segments):
            # 번역하는 사이 보정으로 글이 바뀌었으면 이 결과는 낡았다. 보정 후 번역이 덮어쓴다.
            if segment.best_text != texts[i]:
                continue
            translations = {lang: values[i] for lang, values in result.items() if values[i]}
            if not translations:
                continue
            segment.translations.update(translations)
            await session.store.save_translations(segment.id, translations)
            await session.bus.publish(SegmentTranslated(session.meeting_id, segment, translations))
