from typing import Annotated

from fastapi import APIRouter, Depends

from app.controllers.triage_controller import TriageController
from app.dtos.tickets import TriageRequest, TriageResponse
from app.routers.dependencies import get_triage_controller

router = APIRouter(tags=["triage"])


@router.post("/triage", response_model=TriageResponse)
async def triage(
    payload: TriageRequest,
    controller: Annotated[TriageController, Depends(get_triage_controller)],
) -> TriageResponse:
    return await controller.triage(payload.subject, payload.body)
