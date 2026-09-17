import uuid
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.enums import DisturbanceRisk, EcosystemType, MonitoringStatus, ProjectStatus


class SiteCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    site_code: str = Field(min_length=1, max_length=64)
    ecosystem_type: EcosystemType
    monitoring_status: MonitoringStatus
    boundary: dict[str, Any]
    notes: str | None = None


class SiteUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    site_code: str | None = Field(default=None, min_length=1, max_length=64)
    ecosystem_type: EcosystemType | None = None
    monitoring_status: MonitoringStatus | None = None
    boundary: dict[str, Any] | None = None
    notes: str | None = None


class LatestSnapshot(BaseModel):
    recorded_at: date
    carbon_captured_tco2e: float
    biodiversity_score: float
    species_count: int
    ecosystem_health_score: float
    disturbance_risk: DisturbanceRisk


class ProjectSummary(BaseModel):
    id: uuid.UUID
    name: str
    status: ProjectStatus
    color: str


class SiteRead(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    site_code: str
    ecosystem_type: EcosystemType
    monitoring_status: MonitoringStatus
    notes: str | None
    boundary: dict[str, Any]
    area_hectares: float
    created_at: datetime
    updated_at: datetime
    latest_snapshot: LatestSnapshot | None = None
    project: ProjectSummary | None = None


class SiteListResponse(BaseModel):
    items: list[SiteRead]
    total: int
