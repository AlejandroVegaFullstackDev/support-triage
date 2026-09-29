import anthropic
from pydantic import ValidationError as PydanticValidationError

from app.dtos.tickets import TriageDecision
from app.services.llm_provider import LLMProvider
from app.utils.errors import ExternalServiceError
from app.utils.prompts import TRIAGE_SYSTEM_PROMPT, render_ticket

MAX_TOKENS = 2048


class AnthropicProvider(LLMProvider):
    name = "anthropic"

    def __init__(self, client: anthropic.AsyncAnthropic, model: str) -> None:
        self._client = client
        self._model = model

    async def classify(self, subject: str, body: str) -> TriageDecision:
        try:
            response = await self._client.beta.messages.parse(
                model=self._model,
                max_tokens=MAX_TOKENS,
                system=TRIAGE_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": render_ticket(subject, body)}],
                output_format=TriageDecision,
                output_config={"effort": "low"},
                betas=["server-side-fallback-2026-07-01"],
                fallbacks="default",
            )
        except (anthropic.APIError, PydanticValidationError) as error:
            raise ExternalServiceError(
                f"Anthropic request failed: {type(error).__name__}"
            ) from error

        if response.stop_reason == "refusal" or response.parsed_output is None:
            raise ExternalServiceError(f"Anthropic returned no decision ({response.stop_reason})")
        return response.parsed_output
