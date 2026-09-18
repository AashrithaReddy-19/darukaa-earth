from datetime import date

from pydantic import BaseModel


class ImpactSnapshot(BaseModel):
    recorded_at: date
    carbon_captured_tco2e: float
    biodiversity_score: float
    vegetation_cover_percent: float
    species_count: int


class ImpactChanges(BaseModel):
    carbon_pct: float
    biodiversity_points: float
    vegetation_pct: float
    species_count_delta: int
    nature_health_score_delta: float | None


class ImpactTimelineRead(BaseModel):
    """Restoration Impact Timeline -- derived entirely from existing
    `site_analytics` rows (no new table). `summary` is template-filled from
    `changes`; it is NOT written by an LLM.
    """

    first: ImpactSnapshot
    latest: ImpactSnapshot
    changes: ImpactChanges
    summary: str
