import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.observation import SpeciesObservation
from app.models.project import Project
from app.models.site import Site


class ObservationRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_for_site(self, site_id: uuid.UUID) -> list[SpeciesObservation]:
        stmt = (
            select(SpeciesObservation)
            .where(SpeciesObservation.site_id == site_id)
            .order_by(SpeciesObservation.observed_at.desc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def count_by_category_for_site(self, site_id: uuid.UUID) -> dict[str, int]:
        stmt = (
            select(SpeciesObservation.category, func.sum(SpeciesObservation.observation_count))
            .where(SpeciesObservation.site_id == site_id)
            .group_by(SpeciesObservation.category)
        )
        return {row[0].value: int(row[1]) for row in self.db.execute(stmt).all()}

    def create(self, observation: SpeciesObservation) -> SpeciesObservation:
        self.db.add(observation)
        self.db.commit()
        self.db.refresh(observation)
        return observation

    def total_count_for_owner(self, owner_id: uuid.UUID) -> int:
        stmt = (
            select(func.coalesce(func.sum(SpeciesObservation.observation_count), 0))
            .select_from(SpeciesObservation)
            .join(Site, Site.id == SpeciesObservation.site_id)
            .join(Project, Project.id == Site.project_id)
            .where(Project.owner_id == owner_id)
        )
        return int(self.db.execute(stmt).scalar_one())
