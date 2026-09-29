import openai
from pydantic import ValidationError as PydanticValidationError

from app.dtos.tickets import TriageDecision
from app.services.llm_provider import LLMProvider
from app.utils.errors import ExternalServiceError
from app.utils.prompts import TRIAGE_SYSTEM_PROMPT, render_ticket


class OpenAIProvider(LLMProvider):
    name = "openai"

    def __init__(self, client: openai.AsyncOpenAI, model: str) -> None:
        self._client = client
        self._model = model

    async def classify(self, subject: str, body: str) -> TriageDecision:
        try:
            response = await self._client.responses.parse(
                model=self._model,
                instructions=TRIAGE_SYSTEM_PROMPT,
                input=render_ticket(subject, body),
                text_format=TriageDecision,
            )
        except (openai.OpenAIError, PydanticValidationError) as error:
            raise ExternalServiceError(f"OpenAI request failed: {type(error).__name__}") from error

        if response.output_parsed is None:
            raise ExternalServiceError("OpenAI returned no decision")
        return response.output_parsed
