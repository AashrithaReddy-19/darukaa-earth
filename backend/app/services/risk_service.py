"""Nature Health Score & alert-generation engine (Feature 1 of
FEATURE_CONTRACT_V2).

IMPORTANT: the score computed here is a deterministic, rule-based weighted
formula defined in docs/FEATURE_CONTRACT_V2.md. It is NOT a trained AI/ML
model and does not use any real satellite or sensor feed -- every input comes
from the app's own seeded `site_analytics` rows. The whole feature is demo
intelligence data, and that must be surfaced in the API/UI wherever these
values are shown.

Alert generation rules are likewise a fixed set of documented thresholds
evaluated against the same computation, not a model output.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.alert import SiteAlert
from app.models.analytics import SiteAnalytics
from app.models.enums import DisturbanceRisk
from app.models.risk_assessment import SiteRiskAssessment
from app.repositories.analytics_repository import AnalyticsRepository
from app.repositories.risk_repository import AlertRepository, RiskAssessmentRepository
from app.repositories.site_repository import SiteRepository
from app.schemas.risk_assessment import RiskAssessmentRead, RiskComponents, RiskWeights

WEIGHTS: dict[str, float] = {
    "ecosystem_health": 0.25,
    "biodiversity_trend": 0.20,
    "vegetation_trend": 0.15,
    "carbon_trend": 0.15,
    "soil_moisture": 0.10,
    "disturbance_risk": 0.10,
    "species_trend": 0.05,
}

_DISTURBANCE_SCORE: dict[DisturbanceRisk, float] = {
    DisturbanceRisk.LOW: 100.0,
    DisturbanceRisk.MODERATE: 55.0,
    DisturbanceRisk.HIGH: 10.0,
}

# Checked from the top down; the first threshold the score meets wins.
_BAND_THRESHOLDS: tuple[tuple[float, str], ...] = (
    (80, "healthy"),
    (65, "watch"),
    (45, "at_risk"),
)

_ALERT_DEDUPE_WINDOW = timedelta(hours=24)

_RECOMMENDATIONS: dict[str, str] = {
    "score": "Review the site's Nature Health Score trend and prioritize a follow-up assessment.",
    "vegetation": "Schedule a vegetation survey and evaluate replanting needs in affected zones.",
    "biodiversity": "Conduct a biodiversity survey to identify pressures on key indicator species.",
    "disturbance": (
        "Schedule a field survey and inspect possible illegal activity or habitat disturbance."
    ),
    "soil_moisture": "Investigate irrigation/water table changes and consider a hydrology survey.",
    "species": (
        "Increase field observation frequency to confirm the species decline and identify causes."
    ),
}


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def _pct_change(latest_value: float, baseline_value: float) -> float:
    return (latest_value - baseline_value) / max(baseline_value, 1) * 100


def _trend_score(pct: float) -> float:
    return _clamp(50 + pct * 2)


def _score_band(score: float) -> str:
    for threshold, band in _BAND_THRESHOLDS:
        if score >= threshold:
            return band
    return "critical"


def _subtract_months(d: date, months: int) -> date:
    month_index = d.month - 1 - months
    year = d.year + month_index // 12
    month = month_index % 12 + 1
    day = min(d.day, 28)
    return date(year, month, day)


def _select_baseline(records: list[SiteAnalytics], latest: SiteAnalytics) -> SiteAnalytics:
    """The record closest to (but not after) `latest.recorded_at - 3 months`.

    If fewer than 2 records exist total, the contract says `baseline = latest`
    (all trends become 0%). If every record is more recent than the 3-month
    mark (the site's whole history spans under 3 months), the contract
    doesn't specify a fallback -- we use the earliest available record as the
    closest reasonable approximation of "baseline" (documented deviation).
    """
    if len(records) < 2:
        return latest
    target = _subtract_months(latest.recorded_at, 3)
    candidates = [r for r in records if r.recorded_at <= target]
    if candidates:
        return max(candidates, key=lambda r: r.recorded_at)
    return min(records, key=lambda r: r.recorded_at)


@dataclass
class Computation:
    score: float
    band: str
    carbon_trend: float
    biodiversity_trend: float
    vegetation_trend: float
    soil_moisture_trend: float
    species_trend_pct: float
    disturbance_risk: str
    components: dict[str, float]
    latest: SiteAnalytics
    baseline: SiteAnalytics


def compute_nature_health(records: list[SiteAnalytics]) -> Computation:
    """Run the Feature-1 scoring formula against a chronologically-ordered
    (ascending `recorded_at`) list of a site's analytics records.
    """
    latest = records[-1]
    baseline = _select_baseline(records, latest)

    biodiversity_pct = _pct_change(latest.biodiversity_score, baseline.biodiversity_score)
    vegetation_pct = _pct_change(latest.vegetation_cover_percent, baseline.vegetation_cover_percent)
    carbon_pct = _pct_change(latest.carbon_captured_tco2e, baseline.carbon_captured_tco2e)
    soil_moisture_pct = _pct_change(latest.soil_moisture_percent, baseline.soil_moisture_percent)
    species_pct = _pct_change(float(latest.species_count), float(baseline.species_count))

    components = {
        "ecosystem_health": _clamp(latest.ecosystem_health_score),
        "biodiversity_trend": _trend_score(biodiversity_pct),
        "vegetation_trend": _trend_score(vegetation_pct),
        "carbon_trend": _trend_score(carbon_pct),
        "soil_moisture": _clamp(latest.soil_moisture_percent),
        "disturbance_risk": _DISTURBANCE_SCORE[latest.disturbance_risk],
        "species_trend": _trend_score(species_pct),
    }
    score = round(_clamp(sum(components[key] * WEIGHTS[key] for key in WEIGHTS)))
    band = _score_band(score)

    return Computation(
        score=score,
        band=band,
        carbon_trend=carbon_pct,
        biodiversity_trend=biodiversity_pct,
        vegetation_trend=vegetation_pct,
        soil_moisture_trend=soil_moisture_pct,
        species_trend_pct=species_pct,
        disturbance_risk=latest.disturbance_risk.value,
        components=components,
        latest=latest,
        baseline=baseline,
    )


def evaluate_alert_rules(computation: Computation, site_name: str) -> dict | None:
    """Evaluate the fixed alert-generation rules against one computation.

    Returns a dict with severity/title/description/reasons/recommendation, or
    None if zero conditions triggered (the assessment is still saved by the
    caller either way -- only alert creation is skipped).
    """
    reasons: list[str] = []
    rec_keys: list[str] = []

    score = computation.score
    band = computation.band

    triggered_score = score < 70
    triggered_vegetation = computation.vegetation_trend <= -8
    biodiversity_points = (
        computation.latest.biodiversity_score - computation.baseline.biodiversity_score
    )
    triggered_biodiversity = biodiversity_points <= -5
    disturbance = computation.latest.disturbance_risk
    triggered_disturbance = disturbance == DisturbanceRisk.HIGH
    baseline_disturbance = computation.baseline.disturbance_risk
    triggered_soil = computation.latest.soil_moisture_percent < 20
    triggered_species = computation.species_trend_pct <= -15

    if triggered_score:
        reasons.append(f"Nature Health Score dropped to {score:.0f}/100 ({band}).")
        rec_keys.append("score")
    if triggered_vegetation:
        reasons.append(
            f"Vegetation cover decreased by {abs(computation.vegetation_trend):.0f}% "
            "in the last three months."
        )
        rec_keys.append("vegetation")
    if triggered_biodiversity:
        reasons.append(f"Biodiversity score decreased by {abs(biodiversity_points):.0f} points.")
        rec_keys.append("biodiversity")
    if triggered_disturbance:
        if baseline_disturbance != DisturbanceRisk.HIGH:
            reasons.append(
                "Disturbance risk increased from "
                f"{baseline_disturbance.value.capitalize()} to High."
            )
        else:
            reasons.append("Disturbance risk is High.")
        rec_keys.append("disturbance")
    if triggered_soil:
        reasons.append(
            f"Soil moisture is critically low at {computation.latest.soil_moisture_percent:.0f}%."
        )
        rec_keys.append("soil_moisture")
    if triggered_species:
        reasons.append(
            f"Species observations declined by {abs(computation.species_trend_pct):.0f}% "
            "in the last three months."
        )
        rec_keys.append("species")

    if not reasons:
        return None

    if triggered_disturbance or score < 45:
        severity = "critical"
    elif score < 65 or triggered_vegetation or triggered_biodiversity or triggered_soil:
        severity = "high"
    elif score < 70 or triggered_species:
        severity = "medium"
    else:
        severity = "low"

    recommendation = " ".join(_RECOMMENDATIONS[key] for key in rec_keys[:2])

    return {
        "severity": severity,
        "title": f"{severity.title()} alert: {site_name}",
        "description": f"Nature Health Score: {score:.0f}/100.",
        "reasons": reasons,
        "recommendation": recommendation,
    }


class RiskAssessmentService:
    def __init__(self, db: Session):
        self.db = db
        self.sites = SiteRepository(db)
        self.analytics = AnalyticsRepository(db)
        self.assessments = RiskAssessmentRepository(db)
        self.alerts = AlertRepository(db)

    def _get_owned_site_or_404(self, site_id: uuid.UUID, owner_id: uuid.UUID):
        site = self.sites.get_by_id_for_owner(site_id, owner_id)
        if site is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")
        return site

    def _to_read(
        self, assessment: SiteRiskAssessment, computation: Computation
    ) -> RiskAssessmentRead:
        return RiskAssessmentRead(
            id=assessment.id,
            site_id=assessment.site_id,
            nature_health_score=assessment.nature_health_score,
            score_band=assessment.score_band,
            carbon_trend=assessment.carbon_trend,
            biodiversity_trend=assessment.biodiversity_trend,
            vegetation_trend=assessment.vegetation_trend,
            soil_moisture_trend=assessment.soil_moisture_trend,
            disturbance_risk=assessment.disturbance_risk,
            calculated_at=assessment.calculated_at,
            components=RiskComponents(**computation.components),
            weights=RiskWeights(**WEIGHTS),
        )

    def get_latest(self, site_id: uuid.UUID, owner_id: uuid.UUID) -> RiskAssessmentRead:
        site = self._get_owned_site_or_404(site_id, owner_id)
        assessment = self.assessments.get_latest_for_site(site.id)
        if assessment is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No risk assessment has been calculated for this site yet",
            )
        records = self.analytics.list_for_site(site.id)
        if not records:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No risk assessment has been calculated for this site yet",
            )
        # Components/weights are always recomputed live from the site's
        # current analytics (they are not persisted columns). Since analytics
        # are append-only in this app (no PATCH/DELETE endpoint), this stays
        # consistent with the persisted score/trends unless new analytics
        # rows were added after the last recalculation.
        computation = compute_nature_health(records)
        return self._to_read(assessment, computation)

    def recalculate(self, site_id: uuid.UUID, owner_id: uuid.UUID) -> RiskAssessmentRead:
        site = self._get_owned_site_or_404(site_id, owner_id)
        records = self.analytics.list_for_site(site.id)
        if not records:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Site has no analytics records to calculate a risk assessment from",
            )
        computation = compute_nature_health(records)

        assessment = SiteRiskAssessment(
            site_id=site.id,
            nature_health_score=computation.score,
            score_band=computation.band,
            carbon_trend=computation.carbon_trend,
            biodiversity_trend=computation.biodiversity_trend,
            vegetation_trend=computation.vegetation_trend,
            soil_moisture_trend=computation.soil_moisture_trend,
            disturbance_risk=computation.disturbance_risk,
        )
        assessment = self.assessments.create(assessment)

        alert_payload = evaluate_alert_rules(computation, site.name)
        if alert_payload is not None:
            since = datetime.now(UTC) - _ALERT_DEDUPE_WINDOW
            if not self.alerts.has_recent_open_alert(site.id, since=since):
                alert = SiteAlert(
                    site_id=site.id,
                    assessment_id=assessment.id,
                    status="open",
                    **alert_payload,
                )
                self.alerts.create(alert)

        return self._to_read(assessment, computation)
