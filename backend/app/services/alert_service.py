"""Alert list/update/summary endpoints (Feature 1 of FEATURE_CONTRACT_V2).

Alerts themselves are generated deterministically by
`app/services/risk_service.py` when a risk assessment is (re)calculated. This
module only exposes read/update operations on already-created alerts.
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy.engine import Row
from sqlalchemy.orm import Session

from app.models.enums import AlertSeverity, AlertStatus
from app.models.user import User
from app.repositories.risk_repository import AlertRepository
from app.schemas.alert import AlertRead, AlertsSummary, AlertUpdate
from app.services.audit_log_service import record_audit_event

_TERMINAL_AUDIT_STATUSES = {AlertStatus.ACKNOWLEDGED.value, AlertStatus.RESOLVED.value}


class AlertService:
    def __init__(self, db: Session):
        self.db = db
        self.alerts = AlertRepository(db)

    def _to_read(self, row: Row) -> AlertRead:
        alert, site_name, project_id, project_name = row
        return AlertRead(
            id=alert.id,
            site_id=alert.site_id,
            site_name=site_name,
            project_id=project_id,
            project_name=project_name,
            assessment_id=alert.assessment_id,
            severity=alert.severity,
            title=alert.title,
            description=alert.description,
            reasons=alert.reasons,
            recommendation=alert.recommendation,
            status=alert.status,
            reviewer_note=alert.reviewer_note,
            created_at=alert.created_at,
            updated_at=alert.updated_at,
        )

    def list_alerts(
        self,
        owner_id: uuid.UUID,
        *,
        severity: AlertSeverity | None = None,
        status_filter: AlertStatus | None = None,
        site_id: uuid.UUID | None = None,
    ) -> tuple[list[AlertRead], int]:
        rows = self.alerts.list_for_owner(
            owner_id,
            severity=severity.value if severity else None,
            status=status_filter.value if status_filter else None,
            site_id=site_id,
        )
        reads = [self._to_read(r) for r in rows]
        return reads, len(reads)

    def update_alert(
        self, alert_id: uuid.UUID, owner_id: uuid.UUID, user: User, payload: AlertUpdate
    ) -> AlertRead:
        row = self.alerts.get_full_row_for_owner(alert_id, owner_id)
        if row is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
        alert, site_name, project_id, _project_name = row

        data = payload.model_dump(exclude_unset=True)
        old_status = alert.status
        if "status" in data and data["status"] is not None:
            alert.status = data["status"].value
        if "reviewer_note" in data:
            alert.reviewer_note = data["reviewer_note"]

        alert = self.alerts.update(alert)

        status_changed = "status" in data and alert.status != old_status
        if status_changed and alert.status in _TERMINAL_AUDIT_STATUSES:
            record_audit_event(
                self.db,
                user_id=user.id,
                project_id=project_id,
                site_id=alert.site_id,
                action_type=alert.status,
                entity_type="alert",
                entity_id=alert.id,
                summary=f"{user.full_name} {alert.status} a {alert.severity} alert on {site_name}.",
            )

        row = self.alerts.get_full_row_for_owner(alert.id, owner_id)
        return self._to_read(row)

    def get_alerts_summary(self, owner_id: uuid.UUID) -> AlertsSummary:
        counts = self.alerts.counts_for_owner(owner_id)
        open_count = acknowledged_count = resolved_count = 0
        by_severity = {"low": 0, "medium": 0, "high": 0, "critical": 0}

        for status_value, severity_value, count in counts:
            if status_value == AlertStatus.OPEN.value:
                open_count += count
            elif status_value == AlertStatus.ACKNOWLEDGED.value:
                acknowledged_count += count
            elif status_value == AlertStatus.RESOLVED.value:
                resolved_count += count
            by_severity[severity_value] = by_severity.get(severity_value, 0) + count

        recent_rows = self.alerts.recent_for_owner(owner_id, limit=5)
        recent = [self._to_read(r) for r in recent_rows]

        return AlertsSummary(
            open_count=open_count,
            acknowledged_count=acknowledged_count,
            resolved_count=resolved_count,
            by_severity=by_severity,
            recent=recent,
        )
