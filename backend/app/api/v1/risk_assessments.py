import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.user import User
from app.schemas.impact_timeline import ImpactTimelineRead
from app.schemas.risk_assessment import RiskAssessmentRead
from app.services.impact_timeline_service import ImpactTimelineService
from app.services.risk_service import RiskAssessmentService

router = APIRouter()


@router.get("/sites/{site_id}/risk-assessment", response_model=RiskAssessmentRead)
def get_risk_assessment(
    site_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RiskAssessmentRead:
    return RiskAssessmentService(db).get_latest(site_id, current_user.id)


@router.post(
    "/sites/{site_id}/risk-assessment/recalculate",
    response_model=RiskAssessmentRead,
    status_code=status.HTTP_201_CREATED,
)
def recalculate_risk_assessment(
    site_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RiskAssessmentRead:
    return RiskAssessmentService(db).recalculate(site_id, current_user.id)


@router.get("/sites/{site_id}/impact-timeline", response_model=ImpactTimelineRead)
def get_impact_timeline(
    site_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ImpactTimelineRead:
    return ImpactTimelineService(db).get_timeline(site_id, current_user.id)
