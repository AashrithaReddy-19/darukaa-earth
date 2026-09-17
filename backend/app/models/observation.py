from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import ENUM as PGEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import ObservationCategory

if TYPE_CHECKING:
    from app.models.site import Site


class SpeciesObservation(Base):
    __tablename__ = "species_observations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True
    )
    species_name: Mapped[str] = mapped_column(String(255), nullable=False)
    scientific_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    category: Mapped[ObservationCategory] = mapped_column(
        PGEnum(
            ObservationCategory,
            name="observation_category",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
    )
    observation_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    site: Mapped[Site] = relationship(back_populates="observations")
