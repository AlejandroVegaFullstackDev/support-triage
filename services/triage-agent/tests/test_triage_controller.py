from app.controllers.triage_controller import TriageController
from app.dtos.tickets import Category, Priority, TicketCreatedEvent, TriageDecision
from app.implements.local_provider import LocalProvider
from app.services.llm_provider import LLMProvider
from app.utils.errors import ExternalServiceError


class FailingProvider(LLMProvider):
    name = "anthropic"

    async def classify(self, subject: str, body: str) -> TriageDecision:
        raise ExternalServiceError("timeout")


class FixedProvider(LLMProvider):
    name = "openai"

    async def classify(self, subject: str, body: str) -> TriageDecision:
        return TriageDecision(category=Category.OTHER, priority=Priority.LOW, suggested_reply="ok")


async def test_uses_primary_provider_when_it_succeeds():
    controller = TriageController(FixedProvider(), LocalProvider())

    result = await controller.triage("Consulta", "Quisiera información general")

    assert result.provider == "openai"
    assert result.suggested_reply == "ok"


async def test_falls_back_to_local_when_provider_fails():
    controller = TriageController(FailingProvider(), LocalProvider())

    result = await controller.triage("Me cobraron dos veces", "Pago duplicado en mi tarjeta")

    assert result.provider == "local"
    assert result.category == Category.BILLING


async def test_ticket_created_becomes_ticket_triaged_event():
    controller = TriageController(LocalProvider(), LocalProvider())
    event = TicketCreatedEvent.model_validate(
        {
            "eventId": "e1",
            "ticketId": "t1",
            "subject": "La app está caída",
            "body": "Es urgente, nadie puede pagar",
            "occurredAt": "2026-09-29T12:00:00Z",
            "extraField": "ignored",
        }
    )

    triaged = await controller.handle_ticket_created(event)
    payload = triaged.model_dump(by_alias=True, mode="json")

    assert payload["ticketId"] == "t1"
    assert payload["priority"] == "urgent"
    assert payload["provider"] == "local"
    assert set(payload) == {
        "eventId",
        "ticketId",
        "category",
        "priority",
        "suggestedReply",
        "provider",
        "occurredAt",
    }
