import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class AuditLogRead(BaseModel):
    """Read-only. There is no update/delete schema for audit logs anywhere
    in this app -- `app/services/audit_log_service.py` only ever inserts.
    """

    id: uuid.UUID
    user_id: uuid.UUID | None
    user_name: str | None
    project_id: uuid.UUID | None
    site_id: uuid.UUID | None
    action_type: str
    entity_type: str
    entity_id: uuid.UUID
    summary: str
    metadata: dict[str, Any] | list[Any] | None
    created_at: datetime


class AuditLogListResponse(BaseModel):
    items: list[AuditLogRead]
    total: int
