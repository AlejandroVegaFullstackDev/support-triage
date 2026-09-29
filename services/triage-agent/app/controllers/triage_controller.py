import logging
import uuid
from datetime import UTC, datetime

from app.dtos.tickets import TicketCreatedEvent, TicketTriagedEvent, TriageResponse
from app.implements.local_provider import LocalProvider
from app.services.llm_provider import LLMProvider
from app.utils.errors import ExternalServiceError

logger = logging.getLogger(__name__)


class TriageController:
    def __init__(self, provider: LLMProvider, fallback: LocalProvider) -> None:
        self._provider = provider
        self._fallback = fallback

    @property
    def provider_name(self) -> str:
        return self._provider.name

    async def triage(self, subject: str, body: str) -> TriageResponse:
        try:
            decision = await self._provider.classify(subject, body)
            provider = self._provider.name
        except ExternalServiceError as error:
            logger.warning(
                "Provider %s failed, using local fallback: %s", self._provider.name, error
            )
            decision = await self._fallback.classify(subject, body)
            provider = self._fallback.name
        return TriageResponse(**decision.model_dump(), provider=provider)

    async def handle_ticket_created(self, event: TicketCreatedEvent) -> TicketTriagedEvent:
        result = await self.triage(event.subject, event.body)
        return TicketTriagedEvent(
            event_id=str(uuid.uuid4()),
            ticket_id=event.ticket_id,
            category=result.category,
            priority=result.priority,
            suggested_reply=result.suggested_reply,
            provider=result.provider,
            occurred_at=datetime.now(UTC).isoformat(),
        )
