import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict

from app.models.enums import AnalyticsRange, DisturbanceRisk


class AnalyticsRecordBase(BaseModel):
    recorded_at: date
    carbon_captured_tco2e: float
    biodiversity_score: float
    species_count: int
    vegetation_cover_percent: float
    soil_moisture_percent: float
    ecosystem_health_score: float
    disturbance_risk: DisturbanceRisk


class AnalyticsRecordCreate(AnalyticsRecordBase):
    pass


class AnalyticsRecordRead(AnalyticsRecordBase):
    model_config = ConfigDict(from_attributes=True)


class AnalyticsListResponse(BaseModel):
    site_id: uuid.UUID
    range: AnalyticsRange
    records: list[AnalyticsRecordRead]
    latest: AnalyticsRecordRead | None
