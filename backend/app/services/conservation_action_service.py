"""Conservation Actions (Feature 4 of FEATURE_CONTRACT_V2)."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy.engine import Row
from sqlalchemy.orm import Session

from app.models.conservation_action import ConservationAction
from app.models.enums import ActionStatus
from app.models.user import User
from app.repositories.action_repository import ConservationActionRepository
from app.repositories.risk_repository import AlertRepository
from app.repositories.site_repository import SiteRepository
from app.schemas.conservation_action import (
    ActionsSummary,
    ConservationActionCreate,
    ConservationActionListResponse,
    ConservationActionRead,
    ConservationActionUpdate,
)
from app.services.audit_log_service import record_audit_event


class ConservationActionService:
    def __init__(self, db: Session):
        self.db = db
        self.sites = SiteRepository(db)
        self.actions = ConservationActionRepository(db)
        self.alerts = AlertRepository(db)

    def _get_owned_site_or_404(self, site_id: uuid.UUID, owner_id: uuid.UUID):
        site = self.sites.get_by_id_for_owner(site_id, owner_id)
        if site is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")
        return site

    def _to_read(self, row: Row) -> ConservationActionRead:
        action, site_name, project_id, project_name = row
        return ConservationActionRead(
            id=action.id,
            site_id=action.site_id,
            site_name=site_name,
            project_id=project_id,
            project_name=project_name,
            alert_id=action.alert_id,
            title=action.title,
            description=action.description,
            action_category=action.action_category,
            priority=action.priority,
            status=action.status,
            due_date=action.due_date,
            created_at=action.created_at,
            updated_at=action.updated_at,
        )

    def list_actions(
        self,
        owner_id: uuid.UUID,
        *,
        status_filter: ActionStatus | None = None,
        site_id: uuid.UUID | None = None,
    ) -> ConservationActionListResponse:
        rows = self.actions.list_for_owner(
            owner_id,
            status=status_filter.value if status_filter else None,
            site_id=site_id,
        )
        reads = [self._to_read(r) for r in rows]
        return ConservationActionListResponse(items=reads, total=len(reads))

    def create_action(
        self, owner_id: uuid.UUID, user: User, payload: ConservationActionCreate
    ) -> ConservationActionRead:
        site = self._get_owned_site_or_404(payload.site_id, owner_id)

        alert = None
        if payload.alert_id is not None:
            alert = self.alerts.get_by_id_for_owner(payload.alert_id, owner_id)
            if alert is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

        action = ConservationAction(
            site_id=site.id,
            alert_id=alert.id if alert else None,
            title=payload.title,
            description=payload.description,
            action_category=payload.action_category.value,
            priority=payload.priority.value,
            status=ActionStatus.PLANNED.value,
            due_date=payload.due_date,
        )
        action = self.actions.create(action)

        record_audit_event(
            self.db,
            user_id=user.id,
            project_id=site.project_id,
            site_id=site.id,
            action_type="created",
            entity_type="action",
            entity_id=action.id,
            summary=(
                f"{user.full_name} created a {payload.priority.value.title()}-priority "
                f"{payload.action_category.value} action for {site.name}."
            ),
        )

        row = self.actions.get_row_for_owner(action.id, owner_id)
        return self._to_read(row)

    def update_action(
        self,
        action_id: uuid.UUID,
        owner_id: uuid.UUID,
        user: User,
        payload: ConservationActionUpdate,
    ) -> ConservationActionRead:
        row = self.actions.get_row_for_owner(action_id, owner_id)
        if row is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action not found")
        action, site_name, project_id, _project_name = row

        data = payload.model_dump(exclude_unset=True)
        old_status = action.status
        if "status" in data and data["status"] is not None:
            action.status = data["status"].value
        if "priority" in data and data["priority"] is not None:
            action.priority = data["priority"].value
        if "due_date" in data:
            action.due_date = data["due_date"]

        action = self.actions.update(action)

        if "status" in data and action.status != old_status:
            record_audit_event(
                self.db,
                user_id=user.id,
                project_id=project_id,
                site_id=action.site_id,
                action_type="updated",
                entity_type="action",
                entity_id=action.id,
                summary=(
                    f"{user.full_name} marked the '{action.title}' action as "
                    f"{action.status.replace('_', ' ')} for {site_name}."
                ),
            )

        row = self.actions.get_row_for_owner(action.id, owner_id)
        return self._to_read(row)

    def get_actions_summary(self, owner_id: uuid.UUID) -> ActionsSummary:
        counts = self.actions.status_counts_for_owner(owner_id)
        by_status = {s.value: 0 for s in ActionStatus}
        by_status.update(counts)
        return ActionsSummary(by_status=by_status)
