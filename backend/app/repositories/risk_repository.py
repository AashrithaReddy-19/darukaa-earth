import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.engine import Row
from sqlalchemy.orm import Session

from app.models.alert import SiteAlert
from app.models.project import Project
from app.models.risk_assessment import SiteRiskAssessment
from app.models.site import Site


class RiskAssessmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_latest_for_site(self, site_id: uuid.UUID) -> SiteRiskAssessment | None:
        stmt = (
            select(SiteRiskAssessment)
            .where(SiteRiskAssessment.site_id == site_id)
            .order_by(SiteRiskAssessment.calculated_at.desc())
            .limit(1)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def create(self, assessment: SiteRiskAssessment) -> SiteRiskAssessment:
        self.db.add(assessment)
        self.db.commit()
        self.db.refresh(assessment)
        return assessment


class AlertRepository:
    def __init__(self, db: Session):
        self.db = db

    def has_recent_open_alert(self, site_id: uuid.UUID, *, since: datetime) -> bool:
        stmt = select(SiteAlert.id).where(
            SiteAlert.site_id == site_id,
            SiteAlert.status == "open",
            SiteAlert.created_at >= since,
        )
        return self.db.execute(stmt).scalar_one_or_none() is not None

    def create(self, alert: SiteAlert) -> SiteAlert:
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)
        return alert

    def update(self, alert: SiteAlert) -> SiteAlert:
        self.db.commit()
        self.db.refresh(alert)
        return alert

    def get_by_id_for_owner(self, alert_id: uuid.UUID, owner_id: uuid.UUID) -> SiteAlert | None:
        stmt = (
            select(SiteAlert)
            .join(Site, Site.id == SiteAlert.site_id)
            .join(Project, Project.id == Site.project_id)
            .where(SiteAlert.id == alert_id, Project.owner_id == owner_id)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def _joined_query(self, owner_id: uuid.UUID):
        return (
            select(SiteAlert, Site.name, Project.id, Project.name)
            .join(Site, Site.id == SiteAlert.site_id)
            .join(Project, Project.id == Site.project_id)
            .where(Project.owner_id == owner_id)
        )

    def get_full_row_for_owner(self, alert_id: uuid.UUID, owner_id: uuid.UUID) -> Row | None:
        stmt = self._joined_query(owner_id).where(SiteAlert.id == alert_id)
        return self.db.execute(stmt).first()

    def list_for_owner(
        self,
        owner_id: uuid.UUID,
        *,
        severity: str | None = None,
        status: str | None = None,
        site_id: uuid.UUID | None = None,
    ) -> list[Row]:
        stmt = self._joined_query(owner_id)
        if severity is not None:
            stmt = stmt.where(SiteAlert.severity == severity)
        if status is not None:
            stmt = stmt.where(SiteAlert.status == status)
        if site_id is not None:
            stmt = stmt.where(SiteAlert.site_id == site_id)
        stmt = stmt.order_by(SiteAlert.created_at.desc())
        return list(self.db.execute(stmt).all())

    def recent_for_owner(self, owner_id: uuid.UUID, *, limit: int = 5) -> list[Row]:
        stmt = self._joined_query(owner_id).order_by(SiteAlert.created_at.desc()).limit(limit)
        return list(self.db.execute(stmt).all())

    def counts_for_owner(self, owner_id: uuid.UUID) -> list[Row]:
        stmt = (
            select(SiteAlert.status, SiteAlert.severity, func.count())
            .join(Site, Site.id == SiteAlert.site_id)
            .join(Project, Project.id == Site.project_id)
            .where(Project.owner_id == owner_id)
            .group_by(SiteAlert.status, SiteAlert.severity)
        )
        return list(self.db.execute(stmt).all())
