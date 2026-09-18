from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class FieldObservation(Base):
    """A free-form field note logged by a human observer for a site.

    Distinct from `SpeciesObservation` (structured species-count records used
    by the existing analytics feature) -- this is unstructured/manual field
    reporting: species sightings, habitat notes, threats, restoration
    activity, etc.
    """

    __tablename__ = "field_observations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True
    )
    observer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    observation_type: Mapped[str] = mapped_column(String(30), nullable=False)
    notes: Mapped[str] = mapped_column(Text, nullable=False)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    observation_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
