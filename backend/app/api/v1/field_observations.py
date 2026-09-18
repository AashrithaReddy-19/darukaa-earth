import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.enums import ObservationType
from app.models.user import User
from app.schemas.field_observation import (
    FieldObservationCreate,
    FieldObservationListResponse,
    FieldObservationRead,
)
from app.services.field_observation_service import FieldObservationService

router = APIRouter()


@router.get("/sites/{site_id}/field-observations", response_model=FieldObservationListResponse)
def list_field_observations(
    site_id: uuid.UUID,
    observation_type: ObservationType | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FieldObservationListResponse:
    return FieldObservationService(db).list_observations(
        site_id, current_user.id, observation_type=observation_type
    )


@router.post(
    "/sites/{site_id}/field-observations",
    response_model=FieldObservationRead,
    status_code=status.HTTP_201_CREATED,
)
def create_field_observation(
    site_id: uuid.UUID,
    payload: FieldObservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FieldObservationRead:
    return FieldObservationService(db).create_observation(site_id, current_user, payload)
