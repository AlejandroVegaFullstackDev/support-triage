import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.providers import build_provider
from app.config.settings import AppConfig, get_config
from app.controllers.triage_controller import TriageController
from app.implements.local_provider import LocalProvider
from app.implements.rabbitmq_consumer import RabbitMqConsumer
from app.routers import health, triage
from app.services.llm_provider import LLMProvider

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")


def create_app(config: AppConfig | None = None, provider: LLMProvider | None = None) -> FastAPI:
    config = config or get_config()
    controller = TriageController(provider or build_provider(config), LocalProvider())

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        consumer = (
            RabbitMqConsumer(config.rabbitmq_url, controller) if config.consume_events else None
        )
        if consumer:
            await consumer.start()
        yield
        if consumer:
            await consumer.stop()

    app = FastAPI(title="triage-agent", lifespan=lifespan)
    app.state.config = config
    app.state.triage_controller = controller
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.cors_origin.split(","),
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )
    app.include_router(health.router)
    app.include_router(triage.router)
    return app


app = create_app()
