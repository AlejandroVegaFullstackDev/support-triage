from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class Category(StrEnum):
    BILLING = "billing"
    TECHNICAL = "technical"
    ACCOUNT = "account"
    SHIPPING = "shipping"
    OTHER = "other"


class Priority(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="ignore")


class TriageDecision(BaseModel):
    """What a provider must return. Also the JSON schema sent to LLMs."""

    category: Category
    priority: Priority
    suggested_reply: str = Field(min_length=1, max_length=2000)


class TicketCreatedEvent(CamelModel):
    event_id: str
    ticket_id: str
    subject: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=5000)
    occurred_at: str


class TicketTriagedEvent(CamelModel):
    event_id: str
    ticket_id: str
    category: Category
    priority: Priority
    suggested_reply: str
    provider: str
    occurred_at: str


class TriageRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    subject: str = Field(min_length=3, max_length=200)
    body: str = Field(min_length=10, max_length=5000)


class TriageResponse(TriageDecision):
    provider: str
