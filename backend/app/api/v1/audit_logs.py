import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.user import User
from app.schemas.audit_log import AuditLogListResponse
from app.services.audit_log_service import AuditLogService

router = APIRouter()


@router.get("/audit-logs", response_model=AuditLogListResponse)
def list_audit_logs(
    project_id: uuid.UUID | None = Query(default=None),
    site_id: uuid.UUID | None = Query(default=None),
    limit: int = Query(default=200, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AuditLogListResponse:
    items, total = AuditLogService(db).list_logs(
        current_user.id, project_id=project_id, site_id=site_id, limit=limit
    )
    return AuditLogListResponse(items=items, total=total)
