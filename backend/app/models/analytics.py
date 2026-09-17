from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import ENUM as PGEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import DisturbanceRisk

if TYPE_CHECKING:
    from app.models.site import Site


class SiteAnalytics(Base):
    __tablename__ = "site_analytics"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True
    )
    recorded_at: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    carbon_captured_tco2e: Mapped[float] = mapped_column(Float, nullable=False)
    biodiversity_score: Mapped[float] = mapped_column(Float, nullable=False)
    species_count: Mapped[int] = mapped_column(Integer, nullable=False)
    vegetation_cover_percent: Mapped[float] = mapped_column(Float, nullable=False)
    soil_moisture_percent: Mapped[float] = mapped_column(Float, nullable=False)
    ecosystem_health_score: Mapped[float] = mapped_column(Float, nullable=False)
    disturbance_risk: Mapped[DisturbanceRisk] = mapped_column(
        PGEnum(
            DisturbanceRisk,
            name="disturbance_risk",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    site: Mapped[Site] = relationship(back_populates="analytics")
