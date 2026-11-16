from fastapi import APIRouter, Depends, HTTPException

from ..clients.soniox import SonioxError
from ..container import Container
from .deps import container

router = APIRouter()


@router.post("/api/soniox/temporary-key")
async def temporary_key(c: Container = Depends(container)) -> dict:
    try:
        return {"apiKey": await c.soniox.issue_temporary_key()}
    except SonioxError as e:
        raise HTTPException(502, str(e)) from e
