from typing import Annotated

from fastapi import APIRouter, Depends, Request

from app.controllers.health_controller import HealthController
from app.dtos.health import HealthResponse

router = APIRouter(tags=["health"])


def get_health_controller(request: Request) -> HealthController:
    return HealthController(
        request.app.state.config.service_name,
        request.app.state.triage_controller.provider_name,
    )


@router.get("/health", response_model=HealthResponse)
def health(
    controller: Annotated[HealthController, Depends(get_health_controller)],
) -> HealthResponse:
    return controller.check()
