from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SiteRiskAssessment(Base):
    """A single Nature Health Score calculation snapshot for a site.

    IMPORTANT: this score is produced by a deterministic, rule-based weighted
    formula (see `app/services/risk_service.py`) applied to the existing
    seeded `site_analytics` rows. It is demo intelligence data -- NOT a
    trained AI/ML model, and NOT derived from any real satellite or sensor
    feed.
    """

    __tablename__ = "site_risk_assessments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True
    )
    nature_health_score: Mapped[float] = mapped_column(Float, nullable=False)
    # Stored as a plain string (not a Postgres ENUM type) per FEATURE_CONTRACT_V2's
    # table schema -- validated against `app.models.enums.ScoreBand` in the service layer.
    score_band: Mapped[str] = mapped_column(String(20), nullable=False)
    carbon_trend: Mapped[float] = mapped_column(Float, nullable=False)
    biodiversity_trend: Mapped[float] = mapped_column(Float, nullable=False)
    vegetation_trend: Mapped[float] = mapped_column(Float, nullable=False)
    soil_moisture_trend: Mapped[float] = mapped_column(Float, nullable=False)
    # Snapshot of `latest.disturbance_risk` (from site_analytics) at calc time.
    disturbance_risk: Mapped[str] = mapped_column(String(20), nullable=False)
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
