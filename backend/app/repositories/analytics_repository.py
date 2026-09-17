import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.analytics import SiteAnalytics


class AnalyticsRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_for_site(
        self, site_id: uuid.UUID, *, since: date | None = None
    ) -> list[SiteAnalytics]:
        stmt = select(SiteAnalytics).where(SiteAnalytics.site_id == site_id)
        if since is not None:
            stmt = stmt.where(SiteAnalytics.recorded_at >= since)
        stmt = stmt.order_by(SiteAnalytics.recorded_at.asc())
        return list(self.db.execute(stmt).scalars().all())

    def get_latest_for_site(self, site_id: uuid.UUID) -> SiteAnalytics | None:
        stmt = (
            select(SiteAnalytics)
            .where(SiteAnalytics.site_id == site_id)
            .order_by(SiteAnalytics.recorded_at.desc())
            .limit(1)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_latest_for_sites(self, site_ids: list[uuid.UUID]) -> dict[uuid.UUID, SiteAnalytics]:
        """Latest (by recorded_at) analytics row per site, for a batch of sites."""
        if not site_ids:
            return {}
        stmt = (
            select(SiteAnalytics)
            .where(SiteAnalytics.site_id.in_(site_ids))
            .order_by(SiteAnalytics.site_id, SiteAnalytics.recorded_at.desc())
        )
        latest: dict[uuid.UUID, SiteAnalytics] = {}
        for row in self.db.execute(stmt).scalars().all():
            if row.site_id not in latest:
                latest[row.site_id] = row
        return latest

    def create(self, record: SiteAnalytics) -> SiteAnalytics:
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record
