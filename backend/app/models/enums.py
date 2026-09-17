"""Enum types shared by ORM models and Pydantic schemas.

Values mirror the `## Enums` section of docs/API_CONTRACT.md exactly. Both the
SQLAlchemy models and the Pydantic schemas import these same enums so there is
a single source of truth for the wire format.
"""

import enum


class ProjectType(str, enum.Enum):
    MANGROVE_RESTORATION = "mangrove_restoration"
    FOREST_CONSERVATION = "forest_conservation"
    AGROFORESTRY = "agroforestry"
    WETLAND_RESTORATION = "wetland_restoration"
    GRASSLAND_RESTORATION = "grassland_restoration"


class ProjectStatus(str, enum.Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    MONITORING = "monitoring"
    COMPLETED = "completed"


class EcosystemType(str, enum.Enum):
    MANGROVE = "mangrove"
    FOREST = "forest"
    WETLAND = "wetland"
    GRASSLAND = "grassland"
    AGROFORESTRY = "agroforestry"


class MonitoringStatus(str, enum.Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    NEEDS_REVIEW = "needs_review"
    COMPLETED = "completed"


class ObservationCategory(str, enum.Enum):
    BIRD = "Bird"
    MAMMAL = "Mammal"
    REPTILE = "Reptile"
    AMPHIBIAN = "Amphibian"
    PLANT = "Plant"
    INSECT = "Insect"


class DisturbanceRisk(str, enum.Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"


class AnalyticsRange(str, enum.Enum):
    THREE_MONTHS = "3m"
    SIX_MONTHS = "6m"
    TWELVE_MONTHS = "12m"
    ALL = "all"
