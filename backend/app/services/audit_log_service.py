"""Audit Log (Feature 5 of FEATURE_CONTRACT_V2).

`record_audit_event()` is the ONLY way any row is written into `audit_logs`
in this app -- it is called as a side effect from `project_service.py`,
`site_service.py`, `alert_service.py`, `field_observation_service.py`, and
`conservation_action_service.py`. There is no update/delete path anywhere:
`AuditLogService` below only reads.

NEVER pass a password, JWT, DB connection string, or the Mapbox token into
`summary` or `metadata` -- both are returned verbatim (no redaction) via
`GET /api/v1/audit-logs`.
"""

import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.user_repository import UserRepository
from app.schemas.audit_log import AuditLogRead


def record_audit_event(
    db: Session,
    *,
    user_id: uuid.UUID | None,
    project_id: uuid.UUID | None,
    site_id: uuid.UUID | None,
    action_type: str,
    entity_type: str,
    entity_id: uuid.UUID,
    summary: str,
    metadata: dict[str, Any] | None = None,
) -> AuditLog:
    log = AuditLog(
        user_id=user_id,
        project_id=project_id,
        site_id=site_id,
        action_type=action_type,
        entity_type=entity_type,
        entity_id=entity_id,
        summary=summary,
        event_metadata=metadata,
    )
    return AuditLogRepository(db).create(log)


class AuditLogService:
    def __init__(self, db: Session):
        self.db = db
        self.audit_logs = AuditLogRepository(db)
        self.users = UserRepository(db)

    def list_logs(
        self,
        owner_id: uuid.UUID,
        *,
        project_id: uuid.UUID | None = None,
        site_id: uuid.UUID | None = None,
        limit: int = 200,
    ) -> tuple[list[AuditLogRead], int]:
        items, total = self.audit_logs.list_for_owner(
            owner_id, project_id=project_id, site_id=site_id, limit=limit
        )

        user_ids = {i.user_id for i in items if i.user_id is not None}
        user_names: dict[uuid.UUID, str] = {}
        for uid in user_ids:
            user = self.users.get_by_id(uid)
            if user is not None:
                user_names[uid] = user.full_name

        reads = [
            AuditLogRead(
                id=i.id,
                user_id=i.user_id,
                user_name=user_names.get(i.user_id) if i.user_id else None,
                project_id=i.project_id,
                site_id=i.site_id,
                action_type=i.action_type,
                entity_type=i.entity_type,
                entity_id=i.entity_id,
                summary=i.summary,
                metadata=i.event_metadata,
                created_at=i.created_at,
            )
            for i in items
        ]
        return reads, total
