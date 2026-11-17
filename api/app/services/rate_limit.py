"""사용량 제한. 비용이 드는 요청(LLM·STT 키)을 참여자별로 센다.

목적은 버그·스크립트로 요청이 몰려 비용이 새는 것을 막는 것이다. 정상 사용자가 걸리지 않게
한도는 넉넉히 잡고(config.py), 최근 window 동안의 횟수로 센다. 1분 한도면 1분 뒤 풀린다.

IP 가 아니라 참여자로 센다. 학교 Wi-Fi 처럼 여러 사람이 같은 IP 로 나가면 함께 막히기 때문이다.
"""

import math
import time
from collections import deque
from collections.abc import Callable
from dataclasses import dataclass

# 오래 안 쓴 키를 지우는 주기(호출 수). 메모리가 계속 늘지 않게 한다
SWEEP_EVERY = 1_000


class RateLimiter:
    def __init__(self, limit: int, window_s: float, clock: Callable[[], float] = time.monotonic):
        self.limit = limit
        self.window_s = window_s
        self._clock = clock
        self._hits: dict[str, deque[float]] = {}
        self._calls = 0

    def hit(self, key: str) -> float | None:
        """허용하면 한 번 세고 None. 넘었으면 다시 될 때까지 남은 초를 돌려준다(세지 않는다)."""
        if self.limit <= 0:
            return None
        now = self._clock()
        self._sweep(now)
        hits = self._hits.setdefault(key, deque())
        while hits and now - hits[0] >= self.window_s:
            hits.popleft()
        if len(hits) >= self.limit:
            return max(1, math.ceil(self.window_s - (now - hits[0])))
        hits.append(now)
        return None

    def _sweep(self, now: float) -> None:
        self._calls += 1
        if self._calls % SWEEP_EVERY:
            return
        stale = [k for k, hits in self._hits.items() if not hits or now - hits[-1] >= self.window_s]
        for key in stale:
            del self._hits[key]


@dataclass
class RateLimits:
    segments: RateLimiter
    messages: RateLimiter
    opinions: RateLimiter
    soniox_keys: RateLimiter
    interim_translations: RateLimiter

    @classmethod
    def from_settings(cls, settings) -> "RateLimits":
        return cls(
            segments=RateLimiter(settings.rate_segments_per_min, 60),
            messages=RateLimiter(settings.rate_messages_per_min, 60),
            opinions=RateLimiter(settings.rate_opinions_per_min, 60),
            soniox_keys=RateLimiter(settings.rate_soniox_keys_per_hour, 3_600),
            interim_translations=RateLimiter(settings.rate_interim_translations_per_min, 60),
        )
