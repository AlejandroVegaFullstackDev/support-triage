from abc import ABC, abstractmethod

from app.dtos.tickets import TriageDecision


class LLMProvider(ABC):
    name: str

    @abstractmethod
    async def classify(self, subject: str, body: str) -> TriageDecision:
        """Classify a ticket. Raises ExternalServiceError on any provider failure."""
