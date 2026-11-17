"""녹음 기기가 Soniox 에 직접 붙을 때 쓰는 임시 키. 진짜 키는 서버에만 둔다."""

from fastapi import APIRouter, Depends, HTTPException, Request

from ..clients.soniox import SonioxError
from ..container import Container
from .access import client_ip, enforce, require_access
from .deps import container
from .schemas import SonioxKeyRequest

router = APIRouter(dependencies=[Depends(require_access)])


@router.post("/api/soniox/temporary-key")
async def temporary_key(
    request: Request, body: SonioxKeyRequest | None = None, c: Container = Depends(container)
) -> dict:
    # 녹음을 시작할 때마다 한 번 받는다. 참여자 id 를 모르면(예전 화면) IP 로 센다
    key = body.participant_id if body and body.participant_id else f"ip:{client_ip(request)}"
    enforce(c.limits.soniox_keys, key, "soniox-key")
    try:
        return {"apiKey": await c.soniox.issue_temporary_key()}
    except SonioxError as e:
        raise HTTPException(502, str(e)) from e
