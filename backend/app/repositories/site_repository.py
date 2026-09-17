import uuid

from geoalchemy2 import Geography
from sqlalchemy import cast, func, select
from sqlalchemy.orm import Session, joinedload

from app.models.project import Project
from app.models.site import Site


class SiteRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_for_project(
        self, project_id: uuid.UUID, *, skip: int = 0, limit: int = 200
    ) -> tuple[list[Site], int]:
        stmt = select(Site).where(Site.project_id == project_id)
        total = self.db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
        stmt = stmt.order_by(Site.created_at.desc()).offset(skip).limit(limit)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def list_for_project_ids(self, project_ids: list[uuid.UUID]) -> list[Site]:
        if not project_ids:
            return []
        stmt = select(Site).where(Site.project_id.in_(project_ids))
        return list(self.db.execute(stmt).scalars().all())

    def get_by_id_for_owner(self, site_id: uuid.UUID, owner_id: uuid.UUID) -> Site | None:
        stmt = (
            select(Site)
            .options(joinedload(Site.project))
            .join(Project, Project.id == Site.project_id)
            .where(Site.id == site_id, Project.owner_id == owner_id)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def create(self, site: Site) -> Site:
        self.db.add(site)
        self.db.commit()
        self.db.refresh(site)
        return self.recompute_area(site)

    def update(self, site: Site) -> Site:
        self.db.commit()
        self.db.refresh(site)
        return self.recompute_area(site)

    def delete(self, site: Site) -> None:
        self.db.delete(site)
        self.db.commit()

    def recompute_area(self, site: Site) -> Site:
        """Recompute area_hectares server-side via PostGIS geography area."""
        area = self.db.execute(
            select(func.ST_Area(cast(Site.boundary, Geography)) / 10000).where(Site.id == site.id)
        ).scalar_one()
        site.area_hectares = float(area or 0.0)
        self.db.commit()
        self.db.refresh(site)
        return site

    def is_site_code_taken(self, site_code: str, *, exclude_id: uuid.UUID | None = None) -> bool:
        stmt = select(Site.id).where(Site.site_code == site_code)
        if exclude_id is not None:
            stmt = stmt.where(Site.id != exclude_id)
        return self.db.execute(stmt).scalar_one_or_none() is not None
