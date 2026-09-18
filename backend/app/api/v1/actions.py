import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.enums import ActionStatus
from app.models.user import User
from app.schemas.conservation_action import (
    ActionsSummary,
    ConservationActionCreate,
    ConservationActionListResponse,
    ConservationActionRead,
    ConservationActionUpdate,
)
from app.services.conservation_action_service import ConservationActionService

router = APIRouter()


@router.get("/actions", response_model=ConservationActionListResponse)
def list_actions(
    status: ActionStatus | None = Query(default=None),
    site_id: uuid.UUID | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ConservationActionListResponse:
    return ConservationActionService(db).list_actions(
        current_user.id, status_filter=status, site_id=site_id
    )


@router.post("/actions", response_model=ConservationActionRead, status_code=status.HTTP_201_CREATED)
def create_action(
    payload: ConservationActionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ConservationActionRead:
    return ConservationActionService(db).create_action(current_user.id, current_user, payload)


@router.patch("/actions/{action_id}", response_model=ConservationActionRead)
def update_action(
    action_id: uuid.UUID,
    payload: ConservationActionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ConservationActionRead:
    return ConservationActionService(db).update_action(
        action_id, current_user.id, current_user, payload
    )


@router.get("/dashboard/actions-summary", response_model=ActionsSummary)
def get_actions_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ActionsSummary:
    return ConservationActionService(db).get_actions_summary(current_user.id)
