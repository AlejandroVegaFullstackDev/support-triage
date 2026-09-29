from app.config.providers import build_provider
from app.config.settings import AppConfig


def test_no_keys_selects_local():
    assert build_provider(AppConfig(anthropic_api_key="", openai_api_key="")).name == "local"


def test_openai_key_selects_openai():
    assert (
        build_provider(AppConfig(anthropic_api_key="", openai_api_key="sk-test")).name == "openai"
    )


def test_anthropic_key_wins_over_openai():
    config = AppConfig(anthropic_api_key="sk-ant-test", openai_api_key="sk-test")

    assert build_provider(config).name == "anthropic"
