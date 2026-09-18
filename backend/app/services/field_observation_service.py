"""Field Observations (Feature 3 of FEATURE_CONTRACT_V2)."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enums import ObservationType
from app.models.field_observation import FieldObservation
from app.models.user import User
from app.repositories.field_observation_repository import FieldObservationRepository
from app.repositories.site_repository import SiteRepository
from app.schemas.field_observation import (
    FieldObservationCreate,
    FieldObservationListResponse,
    FieldObservationRead,
)
from app.services.audit_log_service import record_audit_event


class FieldObservationService:
    def __init__(self, db: Session):
        self.db = db
        self.sites = SiteRepository(db)
        self.observations = FieldObservationRepository(db)

    def _get_owned_site_or_404(self, site_id: uuid.UUID, owner_id: uuid.UUID):
        site = self.sites.get_by_id_for_owner(site_id, owner_id)
        if site is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")
        return site

    def _to_read(self, obs: FieldObservation) -> FieldObservationRead:
        return FieldObservationRead(
            id=obs.id,
            site_id=obs.site_id,
            observer_name=obs.observer_name,
            observation_type=obs.observation_type,
            notes=obs.notes,
            latitude=obs.latitude,
            longitude=obs.longitude,
            observation_date=obs.observation_date,
            created_at=obs.created_at,
        )

    def list_observations(
        self,
        site_id: uuid.UUID,
        owner_id: uuid.UUID,
        *,
        observation_type: ObservationType | None = None,
    ) -> FieldObservationListResponse:
        site = self._get_owned_site_or_404(site_id, owner_id)
        items = self.observations.list_for_site(
            site.id, observation_type=observation_type.value if observation_type else None
        )
        reads = [self._to_read(i) for i in items]
        return FieldObservationListResponse(items=reads, total=len(reads))

    def create_observation(
        self, site_id: uuid.UUID, user: User, payload: FieldObservationCreate
    ) -> FieldObservationRead:
        site = self._get_owned_site_or_404(site_id, user.id)
        obs = FieldObservation(
            site_id=site.id,
            observer_name=payload.observer_name,
            observation_type=payload.observation_type.value,
            notes=payload.notes,
            latitude=payload.latitude,
            longitude=payload.longitude,
            observation_date=payload.observation_date,
        )
        obs = self.observations.create(obs)

        record_audit_event(
            self.db,
            user_id=user.id,
            project_id=site.project_id,
            site_id=site.id,
            action_type="created",
            entity_type="field_observation",
            entity_id=obs.id,
            summary=(
                f"{user.full_name} logged a {payload.observation_type.value} field "
                f"observation for {site.name}."
            ),
        )
        return self._to_read(obs)
