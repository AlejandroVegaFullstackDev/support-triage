import pytest
from fastapi.testclient import TestClient

from app.config.settings import AppConfig
from app.main import create_app


@pytest.fixture
def config() -> AppConfig:
    return AppConfig(consume_events=False, anthropic_api_key=None, openai_api_key=None)


@pytest.fixture
def client(config: AppConfig) -> TestClient:
    return TestClient(create_app(config))
