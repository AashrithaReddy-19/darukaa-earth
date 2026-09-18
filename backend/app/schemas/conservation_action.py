import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.enums import ActionCategory, ActionPriority, ActionStatus


class ConservationActionCreate(BaseModel):
    site_id: uuid.UUID
    alert_id: uuid.UUID | None = None
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    action_category: ActionCategory
    priority: ActionPriority
    due_date: date | None = None


class ConservationActionUpdate(BaseModel):
    status: ActionStatus | None = None
    priority: ActionPriority | None = None
    due_date: date | None = None


class ConservationActionRead(BaseModel):
    id: uuid.UUID
    site_id: uuid.UUID
    site_name: str
    project_id: uuid.UUID
    project_name: str
    alert_id: uuid.UUID | None
    title: str
    description: str
    action_category: str
    priority: str
    status: str
    due_date: date | None
    created_at: datetime
    updated_at: datetime


class ConservationActionListResponse(BaseModel):
    items: list[ConservationActionRead]
    total: int


class ActionsSummary(BaseModel):
    by_status: dict[str, int]
