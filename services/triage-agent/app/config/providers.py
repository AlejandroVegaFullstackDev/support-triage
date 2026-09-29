import anthropic
import openai

from app.config.settings import AppConfig
from app.implements.anthropic_provider import AnthropicProvider
from app.implements.local_provider import LocalProvider
from app.implements.openai_provider import OpenAIProvider
from app.services.llm_provider import LLMProvider


def build_provider(config: AppConfig) -> LLMProvider:
    """Pick the provider from whichever API key is set: Anthropic, then OpenAI, then local."""
    if config.anthropic_api_key:
        client = anthropic.AsyncAnthropic(
            api_key=config.anthropic_api_key, timeout=config.llm_timeout_seconds
        )
        return AnthropicProvider(client, config.anthropic_model)
    if config.openai_api_key:
        client = openai.AsyncOpenAI(
            api_key=config.openai_api_key, timeout=config.llm_timeout_seconds
        )
        return OpenAIProvider(client, config.openai_model)
    return LocalProvider()
