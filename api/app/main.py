"""FastAPI 앱 진입점. 실행: uvicorn app.main:app --reload"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .clients.llm import LlmClient
from .config import Settings, get_settings
from .container import build_container
from .routes import health, meeting_socket, meetings, soniox
from .store.base import MeetingStore


def create_app(
    settings: Settings | None = None, *, llm: LlmClient | None = None, store: MeetingStore | None = None
) -> FastAPI:
    settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.container = build_container(settings, llm=llm, store=store)
        yield
        await app.state.container.aclose()

    app = FastAPI(title="Loop AI pipeline", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    for module in (health, soniox, meetings, meeting_socket):
        app.include_router(module.router)
    return app


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
app = create_app()
