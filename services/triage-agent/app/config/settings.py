from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class AppConfig(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    service_name: str = "triage-agent"
    environment: str = "local"
    anthropic_api_key: str | None = None
    openai_api_key: str | None = None
    rabbitmq_url: str = "amqp://guest:guest@localhost:5672/"


@lru_cache
def get_config() -> AppConfig:
    return AppConfig()
