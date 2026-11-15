"""회의 세션 안에서 오가는 이벤트와 이벤트 버스(Observer).

작업(task)과 화면 전송(sink)은 서로를 모르고 이벤트만 구독한다.
기능을 더할 때는 구독자를 하나 더 붙이면 된다.
"""

import logging
from collections import defaultdict
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from typing import Any, TypeVar

from ..domain.models import (
    LiveContext,
    MeetingOutcome,
    OpinionSuggestion,
    Participant,
    Segment,
    SuggestDecision,
)

log = logging.getLogger(__name__)


@dataclass(frozen=True)
class Event:
    meeting_id: str


@dataclass(frozen=True)
class ParticipantJoined(Event):
    participant: Participant


@dataclass(frozen=True)
class SegmentFinalized(Event):
    segment: Segment


@dataclass(frozen=True)
class SegmentCorrected(Event):
    segment: Segment


@dataclass(frozen=True)
class SegmentTranslated(Event):
    segment: Segment
    translations: dict[str, str]


@dataclass(frozen=True)
class ContextUpdated(Event):
    context: LiveContext
    # 번역만 붙여 다시 보낼 때는 None. 의견 추천은 판단이 있는 이벤트에만 반응한다.
    decision: SuggestDecision | None = None


@dataclass(frozen=True)
class OutcomeUpdated(Event):
    outcome: MeetingOutcome


@dataclass(frozen=True)
class OpinionSuggested(Event):
    suggestion: OpinionSuggestion


E = TypeVar("E", bound=Event)
Handler = Callable[[Any], Awaitable[None] | None]


@dataclass
class EventBus:
    _handlers: dict[type[Event], list[Handler]] = field(default_factory=lambda: defaultdict(list))

    def subscribe(self, event_type: type[E], handler: Callable[[E], Awaitable[None] | None]) -> None:
        self._handlers[event_type].append(handler)

    async def publish(self, event: Event) -> None:
        # 구독자는 오래 걸리는 일을 직접 하지 않고 실행 정책에 넘긴다. 한 구독자의 실패가 다른 구독자를 막지 않는다.
        for handler in list(self._handlers[type(event)]):
            try:
                result = handler(event)
                if result is not None:
                    await result
            except Exception:
                log.exception("이벤트 처리 실패: %s", type(event).__name__)
