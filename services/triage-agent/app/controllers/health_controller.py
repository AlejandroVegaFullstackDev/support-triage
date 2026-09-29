from app.config.settings import AppConfig
from app.dtos.health import HealthResponse


class HealthController:
    def __init__(self, config: AppConfig) -> None:
        self._config = config

    def check(self) -> HealthResponse:
        return HealthResponse(status="ok", service=self._config.service_name)
