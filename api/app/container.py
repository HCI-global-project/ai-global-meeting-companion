"""의존성 조립(composition root). 설정을 보고 구현체를 고른다. 테스트는 llm·store 를 바꿔 끼운다."""

from dataclasses import dataclass

import httpx

from .clients.factory import build_llm_client
from .clients.llm import LlmClient
from .clients.soniox import SonioxClient
from .config import Settings
from .pipeline.hub import ConnectionHub
from .pipeline.pipeline import Pipeline
from .pipeline.registry import SessionRegistry
from .pipeline.tasks.correction import CorrectionTask
from .pipeline.tasks.live_context import LiveContextTask
from .pipeline.tasks.opinion import OpinionTask
from .pipeline.tasks.outcome import OutcomeTask
from .pipeline.tasks.translation import TranslationTask
from .services.translation import CachedTranslator, LlmTranslator, Translator
from .store.base import MeetingStore
from .store.memory import InMemoryStore
from .store.supabase import SupabaseStore


@dataclass
class Container:
    settings: Settings
    http: httpx.AsyncClient
    llm: LlmClient
    translator: Translator
    store: MeetingStore
    soniox: SonioxClient
    pipeline: Pipeline
    registry: SessionRegistry
    hub: ConnectionHub

    @property
    def opinion(self) -> OpinionTask:
        task = self.pipeline.find(OpinionTask)
        assert isinstance(task, OpinionTask)
        return task

    async def aclose(self) -> None:
        await self.registry.close_all()
        await self.http.aclose()


def build_container(
    settings: Settings, *, llm: LlmClient | None = None, store: MeetingStore | None = None
) -> Container:
    http = httpx.AsyncClient()
    llm = llm or build_llm_client(settings, http)
    store = store or _build_store(settings, http)
    translator = CachedTranslator(LlmTranslator(llm))
    pipeline = Pipeline(
        [
            CorrectionTask(llm, settings.correction_enabled),
            TranslationTask(translator, settings.translation_context_size, settings.translation_refine_previous),
            LiveContextTask(llm, translator, settings.context_batch_size, settings.context_max_wait_s),
            OutcomeTask(llm, translator, settings.outcome_batch_size, settings.outcome_max_wait_s),
            OpinionTask(
                llm,
                settings.opinion_importance_threshold,
                settings.opinion_cooldown_s,
                settings.opinion_max_concurrency,
                settings.opinion_extra_english,
            ),
        ]
    )
    registry = SessionRegistry(store, pipeline, settings.default_primary_language)
    hub = ConnectionHub()
    registry.on_create(hub.attach)
    return Container(
        settings=settings,
        http=http,
        llm=llm,
        translator=translator,
        store=store,
        soniox=SonioxClient(http, settings.soniox_api_key),
        pipeline=pipeline,
        registry=registry,
        hub=hub,
    )


def _build_store(settings: Settings, http: httpx.AsyncClient) -> MeetingStore:
    if settings.supabase_url and settings.supabase_service_role_key:
        return SupabaseStore(http, settings.supabase_url, settings.supabase_service_role_key)
    return InMemoryStore()
