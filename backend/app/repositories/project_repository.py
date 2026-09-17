import uuid

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.models.enums import ProjectStatus
from app.models.project import Project


class ProjectRepository:
    def __init__(self, db: Session):
        self.db = db

    def _base_query(self, owner_id: uuid.UUID) -> Select:
        return select(Project).where(Project.owner_id == owner_id)

    def list_for_owner(
        self,
        owner_id: uuid.UUID,
        *,
        search: str | None = None,
        status: ProjectStatus | None = None,
        skip: int = 0,
        limit: int = 200,
    ) -> tuple[list[Project], int]:
        stmt = self._base_query(owner_id)
        if search:
            like = f"%{search}%"
            stmt = stmt.where(or_(Project.name.ilike(like), Project.description.ilike(like)))
        if status:
            stmt = stmt.where(Project.status == status)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar_one()

        stmt = stmt.order_by(Project.created_at.desc()).offset(skip).limit(limit)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def get_by_id_for_owner(self, project_id: uuid.UUID, owner_id: uuid.UUID) -> Project | None:
        stmt = self._base_query(owner_id).where(Project.id == project_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def create(self, project: Project) -> Project:
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project

    def update(self, project: Project) -> Project:
        self.db.commit()
        self.db.refresh(project)
        return project

    def delete(self, project: Project) -> None:
        self.db.delete(project)
        self.db.commit()
