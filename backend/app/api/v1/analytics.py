import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.enums import AnalyticsRange
from app.models.user import User
from app.schemas.analytics import AnalyticsListResponse, AnalyticsRecordCreate, AnalyticsRecordRead
from app.schemas.observation import SpeciesObservationListResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/sites/{site_id}/analytics", response_model=AnalyticsListResponse)
def get_analytics(
    site_id: uuid.UUID,
    range_: AnalyticsRange = Query(default=AnalyticsRange.ALL, alias="range"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnalyticsListResponse:
    return AnalyticsService(db).get_analytics(site_id, current_user.id, range_)


@router.post(
    "/sites/{site_id}/analytics",
    response_model=AnalyticsRecordRead,
    status_code=status.HTTP_201_CREATED,
)
def create_analytics(
    site_id: uuid.UUID,
    payload: AnalyticsRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnalyticsRecordRead:
    return AnalyticsService(db).create_analytics(site_id, current_user.id, payload)


@router.get("/sites/{site_id}/species-observations", response_model=SpeciesObservationListResponse)
def get_species_observations(
    site_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SpeciesObservationListResponse:
    return AnalyticsService(db).get_species_observations(site_id, current_user.id)
