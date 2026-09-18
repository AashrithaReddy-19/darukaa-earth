import uuid
from datetime import datetime

from pydantic import BaseModel


class RiskComponents(BaseModel):
    """0-100 sub-scores that feed the weighted Nature Health Score.

    Computed fresh from the site's current `site_analytics` at request time
    (they are not persisted columns -- only the final score/band/trend
    figures are). See `app/services/risk_service.py` for the formula.
    """

    ecosystem_health: float
    biodiversity_trend: float
    vegetation_trend: float
    carbon_trend: float
    soil_moisture: float
    disturbance_risk: float
    species_trend: float


class RiskWeights(BaseModel):
    ecosystem_health: float
    biodiversity_trend: float
    vegetation_trend: float
    carbon_trend: float
    soil_moisture: float
    disturbance_risk: float
    species_trend: float


class RiskAssessmentRead(BaseModel):
    """Nature Health Score assessment.

    This score is a deterministic, rule-based weighted formula -- NOT a
    trained AI/ML model and NOT derived from satellite or sensor feeds. It is
    demo intelligence data computed from the app's own seeded analytics.
    """

    id: uuid.UUID
    site_id: uuid.UUID
    nature_health_score: float
    score_band: str
    carbon_trend: float
    biodiversity_trend: float
    vegetation_trend: float
    soil_moisture_trend: float
    disturbance_risk: str
    calculated_at: datetime
    components: RiskComponents
    weights: RiskWeights
