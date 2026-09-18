import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.enums import ObservationType


class FieldObservationCreate(BaseModel):
    observer_name: str = Field(min_length=1, max_length=255)
    observation_type: ObservationType
    notes: str = Field(min_length=1)
    latitude: float | None = None
    longitude: float | None = None
    observation_date: date


class FieldObservationRead(BaseModel):
    id: uuid.UUID
    site_id: uuid.UUID
    observer_name: str
    observation_type: str
    notes: str
    latitude: float | None
    longitude: float | None
    observation_date: date
    created_at: datetime


class FieldObservationListResponse(BaseModel):
    items: list[FieldObservationRead]
    total: int
