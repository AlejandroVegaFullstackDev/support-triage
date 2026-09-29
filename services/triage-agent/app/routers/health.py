from typing import Annotated

from fastapi import APIRouter, Depends

from app.config.settings import get_config
from app.controllers.health_controller import HealthController
from app.dtos.health import HealthResponse

router = APIRouter(tags=["health"])


def get_health_controller() -> HealthController:
    return HealthController(get_config())


@router.get("/health", response_model=HealthResponse)
def health(
    controller: Annotated[HealthController, Depends(get_health_controller)],
) -> HealthResponse:
    return controller.check()
