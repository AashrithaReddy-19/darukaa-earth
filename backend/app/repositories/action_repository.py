import uuid

from sqlalchemy import func, select
from sqlalchemy.engine import Row
from sqlalchemy.orm import Session

from app.models.conservation_action import ConservationAction
from app.models.project import Project
from app.models.site import Site


class ConservationActionRepository:
    def __init__(self, db: Session):
        self.db = db

    def _joined_query(self, owner_id: uuid.UUID):
        return (
            select(ConservationAction, Site.name, Project.id, Project.name)
            .join(Site, Site.id == ConservationAction.site_id)
            .join(Project, Project.id == Site.project_id)
            .where(Project.owner_id == owner_id)
        )

    def list_for_owner(
        self,
        owner_id: uuid.UUID,
        *,
        status: str | None = None,
        site_id: uuid.UUID | None = None,
    ) -> list[Row]:
        stmt = self._joined_query(owner_id)
        if status is not None:
            stmt = stmt.where(ConservationAction.status == status)
        if site_id is not None:
            stmt = stmt.where(ConservationAction.site_id == site_id)
        stmt = stmt.order_by(ConservationAction.created_at.desc())
        return list(self.db.execute(stmt).all())

    def get_row_for_owner(self, action_id: uuid.UUID, owner_id: uuid.UUID) -> Row | None:
        stmt = self._joined_query(owner_id).where(ConservationAction.id == action_id)
        return self.db.execute(stmt).first()

    def create(self, action: ConservationAction) -> ConservationAction:
        self.db.add(action)
        self.db.commit()
        self.db.refresh(action)
        return action

    def update(self, action: ConservationAction) -> ConservationAction:
        self.db.commit()
        self.db.refresh(action)
        return action

    def status_counts_for_owner(self, owner_id: uuid.UUID) -> dict[str, int]:
        stmt = (
            select(ConservationAction.status, func.count())
            .join(Site, Site.id == ConservationAction.site_id)
            .join(Project, Project.id == Site.project_id)
            .where(Project.owner_id == owner_id)
            .group_by(ConservationAction.status)
        )
        return {row[0]: row[1] for row in self.db.execute(stmt).all()}
