import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import ObservationCategory


class SpeciesObservationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    species_name: str
    scientific_name: str | None
    category: ObservationCategory
    observation_count: int
    observed_at: datetime
    confidence_score: float | None


class SpeciesObservationListResponse(BaseModel):
    items: list[SpeciesObservationRead]
    by_category: dict[str, int]
