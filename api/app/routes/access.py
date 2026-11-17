"""접속 코드 확인과 사용량 제한을 라우트에서 쓰는 모양으로 묶는다.

접속 코드: HTTP 는 X-Access-Code 헤더, WebSocket 은 주소의 code 로 받는다(브라우저 WebSocket 은 헤더를 못 붙인다).
"""

import hmac
import logging

from fastapi import HTTPException, Request, WebSocket

from ..config import Settings
from ..services.rate_limit import RateLimiter

log = logging.getLogger(__name__)

ACCESS_HEADER = "X-Access-Code"
# WebSocket 을 닫을 때 쓰는 코드. 프론트는 이 코드를 보면 다시 붙지 않는다
ACCESS_DENIED_CLOSE = 4403


def code_ok(settings: Settings, given: str | None) -> bool:
    if not settings.access_code:
        return True
    # 길이·내용에 따라 걸리는 시간이 달라지지 않게 비교한다
    return given is not None and hmac.compare_digest(given.encode(), settings.access_code.encode())


def require_access(request: Request) -> None:
    """HTTP 라우터 의존성. 코드가 틀리면 401."""
    settings: Settings = request.app.state.container.settings
    if not code_ok(settings, request.headers.get(ACCESS_HEADER)):
        raise HTTPException(401, "초대 링크로 들어와 주세요.")


def socket_code_ok(socket: WebSocket, settings: Settings) -> bool:
    return code_ok(settings, socket.query_params.get("code"))


def client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def enforce(limiter: RateLimiter, key: str, what: str) -> None:
    """한도를 넘었으면 429 와 Retry-After(초). 프론트는 이 초를 알림에 보여 준다."""
    retry_after = limiter.hit(key)
    if retry_after is None:
        return
    log.warning("사용량 제한 (%s, %s): %s초 뒤 다시", what, key, retry_after)
    raise HTTPException(
        429,
        f"잠시 후 다시 시도해 주세요 ({retry_after}초).",
        headers={"Retry-After": str(int(retry_after))},
    )
