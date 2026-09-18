import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.project import Project
from app.models.site import Site


class AuditLogRepository:
    """Insert + owner-scoped read only -- there is intentionally no
    update/delete method here (see `app/models/audit_log.py`).
    """

    def __init__(self, db: Session):
        self.db = db

    def create(self, log: AuditLog) -> AuditLog:
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def list_for_owner(
        self,
        owner_id: uuid.UUID,
        *,
        project_id: uuid.UUID | None = None,
        site_id: uuid.UUID | None = None,
        limit: int = 200,
    ) -> tuple[list[AuditLog], int]:
        owned_project_ids = select(Project.id).where(Project.owner_id == owner_id)
        owned_site_ids = (
            select(Site.id)
            .join(Project, Project.id == Site.project_id)
            .where(Project.owner_id == owner_id)
        )
        stmt = select(AuditLog).where(
            or_(
                AuditLog.project_id.in_(owned_project_ids),
                AuditLog.site_id.in_(owned_site_ids),
            )
        )
        if project_id is not None:
            stmt = stmt.where(AuditLog.project_id == project_id)
        if site_id is not None:
            stmt = stmt.where(AuditLog.site_id == site_id)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar_one()

        stmt = stmt.order_by(AuditLog.created_at.desc()).limit(limit)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total
