"""initial schema

Creates the postgis extension and the five core tables: users, projects,
sites, site_analytics, species_observations, along with their enum types and
indexes.

Revision ID: 0001
Revises:
Create Date: 2026-09-17 00:00:00.000000

"""

from collections.abc import Sequence

import geoalchemy2
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # PostGIS is required for the `sites.boundary` geometry column and all
    # ST_Area/geography area calculations used by the API.
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    project_type_enum = postgresql.ENUM(
        "mangrove_restoration",
        "forest_conservation",
        "agroforestry",
        "wetland_restoration",
        "grassland_restoration",
        name="project_type",
    )
    project_status_enum = postgresql.ENUM(
        "planning", "active", "monitoring", "completed", name="project_status"
    )
    ecosystem_type_enum = postgresql.ENUM(
        "mangrove", "forest", "wetland", "grassland", "agroforestry", name="ecosystem_type"
    )
    monitoring_status_enum = postgresql.ENUM(
        "active", "paused", "needs_review", "completed", name="monitoring_status"
    )
    disturbance_risk_enum = postgresql.ENUM("low", "moderate", "high", name="disturbance_risk")
    observation_category_enum = postgresql.ENUM(
        "Bird",
        "Mammal",
        "Reptile",
        "Amphibian",
        "Plant",
        "Insect",
        name="observation_category",
    )

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "owner_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("country", sa.String(length=120), nullable=False),
        sa.Column("region", sa.String(length=120), nullable=False),
        sa.Column("project_type", project_type_enum, nullable=False),
        sa.Column("status", project_status_enum, nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("color", sa.String(length=7), nullable=False, server_default="#1b4332"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_projects_owner_id", "projects", ["owner_id"])

    op.create_table(
        "sites",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "project_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("site_code", sa.String(length=64), nullable=False),
        sa.Column("ecosystem_type", ecosystem_type_enum, nullable=False),
        sa.Column("monitoring_status", monitoring_status_enum, nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "boundary",
            geoalchemy2.Geometry(geometry_type="GEOMETRY", srid=4326, spatial_index=True),
            nullable=False,
        ),
        sa.Column("area_hectares", sa.Float(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_sites_project_id", "sites", ["project_id"])
    op.create_index("ix_sites_site_code", "sites", ["site_code"], unique=True)

    op.create_table(
        "site_analytics",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "site_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("sites.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("recorded_at", sa.Date(), nullable=False),
        sa.Column("carbon_captured_tco2e", sa.Float(), nullable=False),
        sa.Column("biodiversity_score", sa.Float(), nullable=False),
        sa.Column("species_count", sa.Integer(), nullable=False),
        sa.Column("vegetation_cover_percent", sa.Float(), nullable=False),
        sa.Column("soil_moisture_percent", sa.Float(), nullable=False),
        sa.Column("ecosystem_health_score", sa.Float(), nullable=False),
        sa.Column("disturbance_risk", disturbance_risk_enum, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_site_analytics_site_id", "site_analytics", ["site_id"])
    op.create_index("ix_site_analytics_recorded_at", "site_analytics", ["recorded_at"])

    op.create_table(
        "species_observations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "site_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("sites.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("species_name", sa.String(length=255), nullable=False),
        sa.Column("scientific_name", sa.String(length=255), nullable=True),
        sa.Column("category", observation_category_enum, nullable=False),
        sa.Column("observation_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("observed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_species_observations_site_id", "species_observations", ["site_id"])


def downgrade() -> None:
    op.drop_index("ix_species_observations_site_id", table_name="species_observations")
    op.drop_table("species_observations")

    op.drop_index("ix_site_analytics_recorded_at", table_name="site_analytics")
    op.drop_index("ix_site_analytics_site_id", table_name="site_analytics")
    op.drop_table("site_analytics")

    op.drop_index("ix_sites_site_code", table_name="sites")
    op.drop_index("ix_sites_project_id", table_name="sites")
    op.drop_table("sites")

    op.drop_index("ix_projects_owner_id", table_name="projects")
    op.drop_table("projects")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    bind = op.get_bind()
    postgresql.ENUM(name="observation_category").drop(bind, checkfirst=True)
    postgresql.ENUM(name="disturbance_risk").drop(bind, checkfirst=True)
    postgresql.ENUM(name="monitoring_status").drop(bind, checkfirst=True)
    postgresql.ENUM(name="ecosystem_type").drop(bind, checkfirst=True)
    postgresql.ENUM(name="project_status").drop(bind, checkfirst=True)
    postgresql.ENUM(name="project_type").drop(bind, checkfirst=True)
