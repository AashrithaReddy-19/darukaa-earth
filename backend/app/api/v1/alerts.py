import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.enums import AlertSeverity, AlertStatus
from app.models.user import User
from app.schemas.alert import AlertListResponse, AlertRead, AlertsSummary, AlertUpdate
from app.services.alert_service import AlertService

router = APIRouter()


@router.get("/alerts", response_model=AlertListResponse)
def list_alerts(
    severity: AlertSeverity | None = Query(default=None),
    status: AlertStatus | None = Query(default=None),
    site_id: uuid.UUID | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AlertListResponse:
    items, total = AlertService(db).list_alerts(
        current_user.id, severity=severity, status_filter=status, site_id=site_id
    )
    return AlertListResponse(items=items, total=total)


@router.patch("/alerts/{alert_id}", response_model=AlertRead)
def update_alert(
    alert_id: uuid.UUID,
    payload: AlertUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AlertRead:
    return AlertService(db).update_alert(alert_id, current_user.id, current_user, payload)


@router.get("/dashboard/alerts-summary", response_model=AlertsSummary)
def get_alerts_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AlertsSummary:
    return AlertService(db).get_alerts_summary(current_user.id)
