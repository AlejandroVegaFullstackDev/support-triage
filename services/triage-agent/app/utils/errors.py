class ValidationError(Exception):
    """Input that can never be processed successfully."""


class ExternalServiceError(Exception):
    """A dependency (LLM provider, broker) failed or returned unusable output."""
