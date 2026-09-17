from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from geoalchemy2 import Geometry
from sqlalchemy import DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import ENUM as PGEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import EcosystemType, MonitoringStatus

if TYPE_CHECKING:
    from app.models.analytics import SiteAnalytics
    from app.models.observation import SpeciesObservation
    from app.models.project import Project


class Site(Base):
    __tablename__ = "sites"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    site_code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    ecosystem_type: Mapped[EcosystemType] = mapped_column(
        PGEnum(
            EcosystemType,
            name="ecosystem_type",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
    )
    monitoring_status: Mapped[MonitoringStatus] = mapped_column(
        PGEnum(
            MonitoringStatus,
            name="monitoring_status",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Accepts both Polygon and MultiPolygon GeoJSON; stored as generic GEOMETRY in
    # WGS84 (SRID 4326). `spatial_index=True` gets GeoAlchemy2 to provision the
    # GIST index automatically whenever the table is created.
    boundary: Mapped[Any] = mapped_column(
        Geometry(geometry_type="GEOMETRY", srid=4326, spatial_index=True), nullable=False
    )
    # Always recomputed server-side via PostGIS ST_Area(geography) -- never trust
    # a client-supplied value.
    area_hectares: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    project: Mapped[Project] = relationship(back_populates="sites")
    analytics: Mapped[list[SiteAnalytics]] = relationship(
        back_populates="site",
        cascade="all, delete-orphan",
        order_by="SiteAnalytics.recorded_at",
    )
    observations: Mapped[list[SpeciesObservation]] = relationship(
        back_populates="site", cascade="all, delete-orphan"
    )
