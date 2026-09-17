import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.models.enums import MonitoringStatus, ProjectStatus


class RecentProject(BaseModel):
    id: uuid.UUID
    name: str
    status: ProjectStatus
    site_count: int
    updated_at: datetime


class RecentSiteActivity(BaseModel):
    id: uuid.UUID
    name: str
    project_name: str
    monitoring_status: MonitoringStatus
    updated_at: datetime


class DashboardSummary(BaseModel):
    total_projects: int
    total_active_sites: int
    total_area_hectares: float
    total_carbon_tco2e: float
    avg_biodiversity_score: float | None
    total_species_observed: int
    recent_projects: list[RecentProject]
    recent_site_activity: list[RecentSiteActivity]


class MapSiteItem(BaseModel):
    id: uuid.UUID
    name: str
    project_id: uuid.UUID
    project_name: str
    project_status: ProjectStatus
    project_color: str
    boundary: dict[str, Any]
    area_hectares: float
    ecosystem_health_score: float | None
    latest_carbon_tco2e: float | None


class MapSitesResponse(BaseModel):
    items: list[MapSiteItem]
