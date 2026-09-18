import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.field_observation import FieldObservation


class FieldObservationRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_for_site(
        self, site_id: uuid.UUID, *, observation_type: str | None = None
    ) -> list[FieldObservation]:
        stmt = select(FieldObservation).where(FieldObservation.site_id == site_id)
        if observation_type is not None:
            stmt = stmt.where(FieldObservation.observation_type == observation_type)
        stmt = stmt.order_by(
            FieldObservation.observation_date.desc(), FieldObservation.created_at.desc()
        )
        return list(self.db.execute(stmt).scalars().all())

    def create(self, observation: FieldObservation) -> FieldObservation:
        self.db.add(observation)
        self.db.commit()
        self.db.refresh(observation)
        return observation
