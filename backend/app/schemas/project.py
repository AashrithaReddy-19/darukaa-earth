import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.enums import ProjectStatus, ProjectType


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    country: str = Field(min_length=1, max_length=120)
    region: str = Field(min_length=1, max_length=120)
    project_type: ProjectType
    status: ProjectStatus
    start_date: date
    end_date: date | None = None
    color: str = Field(default="#1b4332", pattern=r"^#[0-9A-Fa-f]{6}$")


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    country: str | None = Field(default=None, min_length=1, max_length=120)
    region: str | None = Field(default=None, min_length=1, max_length=120)
    project_type: ProjectType | None = None
    status: ProjectStatus | None = None
    start_date: date | None = None
    end_date: date | None = None
    color: str | None = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$")


class ProjectRead(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    description: str
    country: str
    region: str
    project_type: ProjectType
    status: ProjectStatus
    start_date: date
    end_date: date | None
    color: str
    created_at: datetime
    updated_at: datetime
    site_count: int
    total_area_hectares: float
    total_carbon_tco2e: float
    avg_biodiversity_score: float | None


class ProjectListResponse(BaseModel):
    items: list[ProjectRead]
    total: int
