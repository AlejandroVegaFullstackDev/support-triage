from app.dtos.health import HealthResponse


class HealthController:
    def __init__(self, service_name: str, provider_name: str) -> None:
        self._service_name = service_name
        self._provider_name = provider_name

    def check(self) -> HealthResponse:
        return HealthResponse(status="ok", service=self._service_name, provider=self._provider_name)
