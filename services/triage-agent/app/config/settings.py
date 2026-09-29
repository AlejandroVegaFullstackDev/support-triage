from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class AppConfig(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    service_name: str = "triage-agent"
    rabbitmq_url: str = "amqp://guest:guest@localhost:5672/"
    consume_events: bool = True
    cors_origin: str = "http://localhost:5173"

    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-opus-5-5"
    openai_api_key: str | None = None
    openai_model: str = "gpt-5-mini"
    llm_timeout_seconds: float = 30.0


@lru_cache
def get_config() -> AppConfig:
    return AppConfig()
