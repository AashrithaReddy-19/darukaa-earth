from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AuditLog(Base):
    """Insert-only audit trail.

    There is no update/delete path anywhere in the API for this table --
    only `app.services.audit_log_service.record_audit_event()` may insert
    rows, and only read-only endpoints (`GET /api/v1/audit-logs`) expose
    them. Never write passwords, JWTs, DB connection strings, or the Mapbox
    token into `summary` or `event_metadata` (the `metadata` column) -- both
    are returned verbatim to the owning user with no redaction step.
    """

    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    site_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sites.id", ondelete="SET NULL"), nullable=True, index=True
    )
    action_type: Mapped[str] = mapped_column(String(30), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(30), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    summary: Mapped[str] = mapped_column(String(500), nullable=False)
    # Python attribute is `event_metadata` because `Base.metadata` is reserved
    # by SQLAlchemy's declarative machinery; the DB column is still named
    # `metadata`, matching FEATURE_CONTRACT_V2's table schema exactly.
    event_metadata: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(
        "metadata", JSON, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
