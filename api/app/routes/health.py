from fastapi import APIRouter, Depends

from ..container import Container
from ..store.memory import InMemoryStore
from .deps import container

router = APIRouter()


@router.get("/api/health")
async def health(c: Container = Depends(container)) -> dict:
    return {
        "ok": True,
        "aiProvider": c.settings.ai_provider,
        "store": "memory" if isinstance(c.store, InMemoryStore) else "supabase",
        "sonioxConfigured": c.soniox.configured,
    }
