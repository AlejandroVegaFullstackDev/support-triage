from fastapi import Request

from app.controllers.triage_controller import TriageController


def get_triage_controller(request: Request) -> TriageController:
    return request.app.state.triage_controller
