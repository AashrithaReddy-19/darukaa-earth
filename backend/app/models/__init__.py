"""Aggregates all ORM model modules so `Base.metadata` is fully populated.

Import this package (or any name from it) before calling `Base.metadata.create_all`
or running Alembic autogenerate, so every table is registered.
"""

from app.models.analytics import SiteAnalytics
from app.models.observation import SpeciesObservation
from app.models.project import Project
from app.models.site import Site
from app.models.user import User

__all__ = [
    "User",
    "Project",
    "Site",
    "SiteAnalytics",
    "SpeciesObservation",
]
