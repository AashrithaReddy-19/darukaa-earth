import uuid
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.analytics import SiteAnalytics
from app.models.enums import AnalyticsRange, ObservationCategory
from app.repositories.analytics_repository import AnalyticsRepository
from app.repositories.observation_repository import ObservationRepository
from app.repositories.site_repository import SiteRepository
from app.schemas.analytics import AnalyticsListResponse, AnalyticsRecordCreate, AnalyticsRecordRead
from app.schemas.observation import SpeciesObservationListResponse, SpeciesObservationRead

_RANGE_MONTHS = {
    AnalyticsRange.THREE_MONTHS: 3,
    AnalyticsRange.SIX_MONTHS: 6,
    AnalyticsRange.TWELVE_MONTHS: 12,
}


def _months_ago(months: int) -> date:
    """Return the date `months` calendar months before today (day clamped to 28
    to avoid month-end overflow issues), without pulling in a dateutil dependency.
    """
    today = date.today()
    month_index = today.month - 1 - months
    year = today.year + month_index // 12
    month = month_index % 12 + 1
    day = min(today.day, 28)
    return date(year, month, day)


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db
        self.sites = SiteRepository(db)
        self.analytics = AnalyticsRepository(db)
        self.observations = ObservationRepository(db)

    def _get_owned_site_or_404(self, site_id: uuid.UUID, owner_id: uuid.UUID):
        site = self.sites.get_by_id_for_owner(site_id, owner_id)
        if site is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")
        return site

    def get_analytics(
        self, site_id: uuid.UUID, owner_id: uuid.UUID, range_: AnalyticsRange
    ) -> AnalyticsListResponse:
        self._get_owned_site_or_404(site_id, owner_id)

        since = None
        if range_ in _RANGE_MONTHS:
            since = _months_ago(_RANGE_MONTHS[range_])

        records = self.analytics.list_for_site(site_id, since=since)
        record_reads = [AnalyticsRecordRead.model_validate(r) for r in records]
        latest = record_reads[-1] if record_reads else None

        return AnalyticsListResponse(
            site_id=site_id, range=range_, records=record_reads, latest=latest
        )

    def create_analytics(
        self, site_id: uuid.UUID, owner_id: uuid.UUID, payload: AnalyticsRecordCreate
    ) -> AnalyticsRecordRead:
        self._get_owned_site_or_404(site_id, owner_id)
        record = SiteAnalytics(site_id=site_id, **payload.model_dump())
        record = self.analytics.create(record)
        return AnalyticsRecordRead.model_validate(record)

    def get_species_observations(
        self, site_id: uuid.UUID, owner_id: uuid.UUID
    ) -> SpeciesObservationListResponse:
        self._get_owned_site_or_404(site_id, owner_id)
        items = self.observations.list_for_site(site_id)

        by_category = {category.value: 0 for category in ObservationCategory}
        by_category.update(self.observations.count_by_category_for_site(site_id))

        return SpeciesObservationListResponse(
            items=[SpeciesObservationRead.model_validate(i) for i in items],
            by_category=by_category,
        )
