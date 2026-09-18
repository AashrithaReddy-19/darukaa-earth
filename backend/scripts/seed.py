"""Seed the Darukaa.Earth database with realistic demo data.

Run from the `backend/` directory with:

    python -m scripts.seed

This truncates the core tables first, so it is meant to run once against a
fresh (migrated) database. Running it again is safe -- it will simply wipe and
re-seed everything, but it is NOT meant to be layered on top of real data.
"""

from __future__ import annotations

import math
import random
import sys
from datetime import UTC, date, datetime, timedelta
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from geoalchemy2.shape import from_shape  # noqa: E402
from shapely.geometry import Polygon  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app.core.security import hash_password  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.models.alert import SiteAlert  # noqa: E402
from app.models.analytics import SiteAnalytics  # noqa: E402
from app.models.conservation_action import ConservationAction  # noqa: E402
from app.models.enums import (  # noqa: E402
    ActionCategory,
    ActionPriority,
    ActionStatus,
    AlertStatus,
    DisturbanceRisk,
    EcosystemType,
    MonitoringStatus,
    ObservationCategory,
    ObservationType,
    ProjectStatus,
    ProjectType,
)
from app.models.field_observation import FieldObservation  # noqa: E402
from app.models.observation import SpeciesObservation  # noqa: E402
from app.models.project import Project  # noqa: E402
from app.models.risk_assessment import SiteRiskAssessment  # noqa: E402
from app.models.site import Site  # noqa: E402
from app.models.user import User  # noqa: E402
from app.repositories.action_repository import ConservationActionRepository  # noqa: E402
from app.repositories.analytics_repository import AnalyticsRepository  # noqa: E402
from app.repositories.field_observation_repository import (  # noqa: E402
    FieldObservationRepository,
)
from app.repositories.risk_repository import AlertRepository, RiskAssessmentRepository  # noqa: E402
from app.services.audit_log_service import record_audit_event  # noqa: E402
from app.services.risk_service import compute_nature_health, evaluate_alert_rules  # noqa: E402

random.seed(42)

ADMIN_EMAIL = "admin@darukaa.earth"
ADMIN_PASSWORD = "Demo@12345"
ADMIN_NAME = "Darukaa Admin"

MONTHS_OF_HISTORY = 13  # >= 12 monthly analytics records per site

SPECIES_BY_ECOSYSTEM: dict[EcosystemType, list[tuple[str, str, ObservationCategory]]] = {
    EcosystemType.MANGROVE: [
        ("Fishing Cat", "Prionailurus viverrinus", ObservationCategory.MAMMAL),
        ("Mudskipper", "Periophthalmus modestus", ObservationCategory.AMPHIBIAN),
        ("Collared Kingfisher", "Todiramphus chloris", ObservationCategory.BIRD),
        ("Estuarine Crocodile", "Crocodylus porosus", ObservationCategory.REPTILE),
        ("Sundari Tree", "Heritiera fomes", ObservationCategory.PLANT),
        ("Mangrove Horseshoe Crab", "Carcinoscorpius rotundicauda", ObservationCategory.INSECT),
    ],
    EcosystemType.WETLAND: [
        ("Painted Stork", "Mycteria leucocephala", ObservationCategory.BIRD),
        ("Smooth-coated Otter", "Lutrogale perspicillata", ObservationCategory.MAMMAL),
        ("Indian Flapshell Turtle", "Lissemys punctata", ObservationCategory.REPTILE),
        ("Indian Bullfrog", "Hoplobatrachus tigerinus", ObservationCategory.AMPHIBIAN),
        ("Water Hyacinth", "Eichhornia crassipes", ObservationCategory.PLANT),
        ("Common Blue Dragonfly", "Anisoptera sp.", ObservationCategory.INSECT),
    ],
    EcosystemType.FOREST: [
        ("Nilgiri Langur", "Semnopithecus johnii", ObservationCategory.MAMMAL),
        ("Malabar Giant Squirrel", "Ratufa indica", ObservationCategory.MAMMAL),
        ("King Cobra", "Ophiophagus hannah", ObservationCategory.REPTILE),
        ("Malabar Trogon", "Harpactes fasciatus", ObservationCategory.BIRD),
        ("Malabar Gliding Frog", "Rhacophorus malabaricus", ObservationCategory.AMPHIBIAN),
        ("Indian Rosewood", "Dalbergia latifolia", ObservationCategory.PLANT),
    ],
    EcosystemType.GRASSLAND: [
        ("Blackbuck", "Antilope cervicapra", ObservationCategory.MAMMAL),
        ("Great Indian Bustard", "Ardeotis nigriceps", ObservationCategory.BIRD),
        ("Indian Star Tortoise", "Geochelone elegans", ObservationCategory.REPTILE),
        ("Indian Bullfrog", "Hoplobatrachus tigerinus", ObservationCategory.AMPHIBIAN),
        ("Lemongrass", "Cymbopogon flexuosus", ObservationCategory.PLANT),
        ("Field Cricket", "Gryllus bimaculatus", ObservationCategory.INSECT),
    ],
    EcosystemType.AGROFORESTRY: [
        ("Indian Peafowl", "Pavo cristatus", ObservationCategory.BIRD),
        ("Indian Honey Bee", "Apis cerana indica", ObservationCategory.INSECT),
        ("Neem", "Azadirachta indica", ObservationCategory.PLANT),
        ("Indian Palm Squirrel", "Funambulus palmarum", ObservationCategory.MAMMAL),
        ("Oriental Garden Lizard", "Calotes versicolor", ObservationCategory.REPTILE),
        ("Common Indian Toad", "Duttaphrynus melanostictus", ObservationCategory.AMPHIBIAN),
    ],
}


def make_polygon(
    center_lng: float, center_lat: float, radius_deg: float, n_vertices: int, seed_offset: int
) -> Polygon:
    """A small, realistic, non-self-intersecting polygon around a center point."""
    rnd = random.Random(seed_offset)
    points: list[tuple[float, float]] = []
    for i in range(n_vertices):
        angle = 2 * math.pi * i / n_vertices
        jitter = radius_deg * rnd.uniform(0.7, 1.15)
        lng = center_lng + jitter * math.cos(angle)
        lat = center_lat + jitter * math.sin(angle) * 0.75
        points.append((round(lng, 6), round(lat, 6)))
    points.append(points[0])
    return Polygon(points)


def month_start_series(months: int) -> list[date]:
    today = date.today().replace(day=1)
    series = []
    for i in range(months - 1, -1, -1):
        month_index = today.month - 1 - i
        year = today.year + month_index // 12
        month = month_index % 12 + 1
        series.append(date(year, month, 1))
    return series


def generate_analytics_series(
    seed_value: int, base_carbon: float, base_biodiversity: float, months: list[date]
) -> list[dict]:
    rnd = random.Random(seed_value)
    records = []
    carbon = base_carbon
    biodiversity = base_biodiversity
    for idx, month in enumerate(months):
        carbon += rnd.uniform(2.0, 9.0)
        biodiversity = min(96.0, biodiversity + rnd.uniform(-1.0, 2.2))
        species_count = int(18 + idx * rnd.uniform(0.3, 1.1))
        vegetation = min(96.0, 38 + idx * rnd.uniform(0.5, 1.5) + rnd.uniform(-3, 3))
        soil_moisture = max(10.0, 32 + rnd.uniform(-6, 14))
        health_growth = 64 + idx * rnd.uniform(0.3, 1.0) + rnd.uniform(-4, 4)
        ecosystem_health = max(60.0, min(90.0, health_growth))

        risk_roll = rnd.random()
        if risk_roll < 0.65:
            risk = DisturbanceRisk.LOW
        elif risk_roll < 0.9:
            risk = DisturbanceRisk.MODERATE
        else:
            risk = DisturbanceRisk.HIGH

        records.append(
            {
                "recorded_at": month,
                "carbon_captured_tco2e": round(carbon, 2),
                "biodiversity_score": round(biodiversity, 2),
                "species_count": species_count,
                "vegetation_cover_percent": round(vegetation, 2),
                "soil_moisture_percent": round(soil_moisture, 2),
                "ecosystem_health_score": round(ecosystem_health, 2),
                "disturbance_risk": risk,
            }
        )
    return records


def truncate_all(db) -> None:
    db.execute(
        text(
            "TRUNCATE TABLE audit_logs, conservation_actions, field_observations, "
            "site_alerts, site_risk_assessments, species_observations, site_analytics, "
            "sites, projects, users RESTART IDENTITY CASCADE"
        )
    )
    db.commit()


def recompute_area(db, site: Site) -> None:
    area = db.execute(
        text("SELECT ST_Area(boundary::geography) / 10000 FROM sites WHERE id = :id"),
        {"id": str(site.id)},
    ).scalar_one()
    site.area_hectares = float(area or 0.0)
    db.commit()


PROJECTS_SPEC = [
    {
        "name": "Sundarbans Mangrove Restoration",
        "description": (
            "Community-led restoration of degraded mangrove stands across the Indian "
            "Sundarbans, rebuilding coastal storm buffers, blue-carbon stocks, and "
            "nursery habitat for estuarine fisheries."
        ),
        "country": "India",
        "region": "West Bengal",
        "project_type": ProjectType.MANGROVE_RESTORATION,
        "status": ProjectStatus.ACTIVE,
        "start_years_ago": 2.15,
        "color": "#1b4332",
        "sites": [
            {
                "name": "Gosaba Mangrove Belt",
                "site_code": "SND-001",
                "ecosystem_type": EcosystemType.MANGROVE,
                "monitoring_status": MonitoringStatus.ACTIVE,
                "notes": "Primary tidal restoration block with a community-run seedling nursery.",
                "center": (88.95, 21.90),
                "base_carbon": 180.0,
                "base_biodiversity": 55.0,
            },
            {
                "name": "Sagar Island Fringe",
                "site_code": "SND-002",
                "ecosystem_type": EcosystemType.MANGROVE,
                "monitoring_status": MonitoringStatus.NEEDS_REVIEW,
                "notes": "Erosion-prone fringe site; recent cyclone damage under assessment.",
                "center": (89.10, 21.68),
                "base_carbon": 120.0,
                "base_biodiversity": 48.0,
            },
            {
                "name": "Matla Estuary Wetland",
                "site_code": "SND-003",
                "ecosystem_type": EcosystemType.WETLAND,
                "monitoring_status": MonitoringStatus.ACTIVE,
                "notes": "Brackish wetland transition zone bordering the restoration belt.",
                "center": (89.02, 21.78),
                "base_carbon": 95.0,
                "base_biodiversity": 60.0,
            },
        ],
    },
    {
        "name": "Western Ghats Biodiversity Corridor",
        "description": (
            "Protecting and reconnecting fragmented shola-forest and grassland habitat "
            "across the Western Ghats to safeguard endemic species and montane water "
            "catchments."
        ),
        "country": "India",
        "region": "Karnataka / Kerala",
        "project_type": ProjectType.FOREST_CONSERVATION,
        "status": ProjectStatus.MONITORING,
        "start_years_ago": 1.5,
        "color": "#2d6a4f",
        "sites": [
            {
                "name": "Kodagu Shola Forest",
                "site_code": "WG-001",
                "ecosystem_type": EcosystemType.FOREST,
                "monitoring_status": MonitoringStatus.ACTIVE,
                "notes": "Dense evergreen shola forest patch with camera-trap monitoring.",
                "center": (75.80, 12.40),
                "base_carbon": 260.0,
                "base_biodiversity": 68.0,
            },
            {
                "name": "Wayanad Grassland Corridor",
                "site_code": "WG-002",
                "ecosystem_type": EcosystemType.GRASSLAND,
                "monitoring_status": MonitoringStatus.PAUSED,
                "notes": "High-altitude shola-grassland mosaic; monitoring paused for the monsoon.",
                "center": (76.10, 11.70),
                "base_carbon": 140.0,
                "base_biodiversity": 62.0,
            },
        ],
    },
    {
        "name": "Deccan Agroforestry Initiative",
        "description": (
            "Supporting smallholder farmers across the Deccan plateau in adopting native "
            "tree-crop agroforestry systems to improve soil health, farm incomes, and "
            "on-farm carbon sequestration."
        ),
        "country": "India",
        "region": "Maharashtra",
        "project_type": ProjectType.AGROFORESTRY,
        "status": ProjectStatus.PLANNING,
        "start_years_ago": 1.1,
        "color": "#a68a4a",
        "sites": [
            {
                "name": "Ahmednagar Agroforestry Plot",
                "site_code": "DCN-001",
                "ecosystem_type": EcosystemType.AGROFORESTRY,
                "monitoring_status": MonitoringStatus.ACTIVE,
                "notes": "Mixed neem, mango, and pigeon-pea intercropping demonstration plot.",
                "center": (74.75, 19.15),
                "base_carbon": 60.0,
                "base_biodiversity": 40.0,
            },
            {
                "name": "Pune Rural Agroforestry Belt",
                "site_code": "DCN-002",
                "ecosystem_type": EcosystemType.AGROFORESTRY,
                "monitoring_status": MonitoringStatus.NEEDS_REVIEW,
                "notes": "Newly enrolled farmer cooperative; baseline survey pending review.",
                "center": (75.30, 18.55),
                "base_carbon": 35.0,
                "base_biodiversity": 35.0,
            },
        ],
    },
]


def seed() -> None:
    db = SessionLocal()
    try:
        print("Truncating existing data...")
        truncate_all(db)

        print(f"Creating admin user ({ADMIN_EMAIL})...")
        admin = User(
            full_name=ADMIN_NAME,
            email=ADMIN_EMAIL,
            hashed_password=hash_password(ADMIN_PASSWORD),
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

        # --- Nature Intelligence repositories (FEATURE_CONTRACT_V2) ---
        analytics_repo = AnalyticsRepository(db)
        assessment_repo = RiskAssessmentRepository(db)
        alert_repo = AlertRepository(db)
        observation_repo = FieldObservationRepository(db)
        action_repo = ConservationActionRepository(db)

        audit_count = 0

        def log_audit(*, project_id, site_id, action_type, entity_type, entity_id, summary) -> None:
            nonlocal audit_count
            record_audit_event(
                db,
                user_id=admin.id,
                project_id=project_id,
                site_id=site_id,
                action_type=action_type,
                entity_type=entity_type,
                entity_id=entity_id,
                summary=summary,
            )
            audit_count += 1

        months = month_start_series(MONTHS_OF_HISTORY)
        today = date.today()

        site_counter = 0
        total_sites = 0
        total_analytics = 0
        total_observations = 0
        total_assessments = 0
        total_alerts = 0
        total_field_observations = 0
        total_actions = 0
        first_site: Site | None = None
        first_site_project_id = None
        demo_status_transition_done = False
        demo_alert_ack_done = False

        for project_spec in PROJECTS_SPEC:
            start_date = today - timedelta(days=int(project_spec["start_years_ago"] * 365))
            project = Project(
                owner_id=admin.id,
                name=project_spec["name"],
                description=project_spec["description"],
                country=project_spec["country"],
                region=project_spec["region"],
                project_type=project_spec["project_type"],
                status=project_spec["status"],
                start_date=start_date,
                end_date=None,
                color=project_spec["color"],
            )
            db.add(project)
            db.commit()
            db.refresh(project)
            print(f"  Created project: {project.name}")
            log_audit(
                project_id=project.id,
                site_id=None,
                action_type="created",
                entity_type="project",
                entity_id=project.id,
                summary=f"{ADMIN_NAME} created the project '{project.name}'.",
            )

            for site_spec in project_spec["sites"]:
                site_counter += 1
                center_lng, center_lat = site_spec["center"]
                polygon = make_polygon(
                    center_lng, center_lat, radius_deg=0.018, n_vertices=6, seed_offset=site_counter
                )
                site = Site(
                    project_id=project.id,
                    name=site_spec["name"],
                    site_code=site_spec["site_code"],
                    ecosystem_type=site_spec["ecosystem_type"],
                    monitoring_status=site_spec["monitoring_status"],
                    notes=site_spec["notes"],
                    boundary=from_shape(polygon, srid=4326),
                    area_hectares=0.0,
                )
                db.add(site)
                db.commit()
                db.refresh(site)
                recompute_area(db, site)
                total_sites += 1
                print(f"    Created site: {site.name} ({site.area_hectares:.2f} ha)")
                if first_site is None:
                    first_site = site
                    first_site_project_id = project.id
                log_audit(
                    project_id=project.id,
                    site_id=site.id,
                    action_type="created",
                    entity_type="site",
                    entity_id=site.id,
                    summary=f"{ADMIN_NAME} added a site boundary for {site.name}.",
                )

                analytics_records = generate_analytics_series(
                    seed_value=site_counter,
                    base_carbon=site_spec["base_carbon"],
                    base_biodiversity=site_spec["base_biodiversity"],
                    months=months,
                )
                for record in analytics_records:
                    db.add(SiteAnalytics(site_id=site.id, **record))
                total_analytics += len(analytics_records)
                db.commit()
                log_audit(
                    project_id=project.id,
                    site_id=site.id,
                    action_type="created",
                    entity_type="analytics",
                    entity_id=site.id,
                    summary=(
                        f"{ADMIN_NAME} logged {len(analytics_records)} months of analytics "
                        f"for {site.name}."
                    ),
                )

                species_list = SPECIES_BY_ECOSYSTEM[site_spec["ecosystem_type"]]
                rnd = random.Random(site_counter * 7)
                for species_name, scientific_name, category in species_list:
                    observed_at = datetime.now(UTC) - timedelta(days=rnd.randint(1, 360))
                    db.add(
                        SpeciesObservation(
                            site_id=site.id,
                            species_name=species_name,
                            scientific_name=scientific_name,
                            category=category,
                            observation_count=rnd.randint(3, 40),
                            observed_at=observed_at,
                            confidence_score=round(rnd.uniform(0.6, 0.99), 2),
                        )
                    )
                    total_observations += 1
                db.commit()

                # --- Nature Intelligence seed data (FEATURE_CONTRACT_V2) ---
                # Nature Health Score + alert generation run against the
                # analytics just seeded above, using the exact same
                # deterministic scoring/rule engine the API uses
                # (app/services/risk_service.py) -- this is demo
                # intelligence data, not a trained model.
                records = analytics_repo.list_for_site(site.id)
                computation = compute_nature_health(records)
                assessment = assessment_repo.create(
                    SiteRiskAssessment(
                        site_id=site.id,
                        nature_health_score=computation.score,
                        score_band=computation.band,
                        carbon_trend=computation.carbon_trend,
                        biodiversity_trend=computation.biodiversity_trend,
                        vegetation_trend=computation.vegetation_trend,
                        soil_moisture_trend=computation.soil_moisture_trend,
                        disturbance_risk=computation.disturbance_risk,
                    )
                )
                total_assessments += 1

                alert_payload = evaluate_alert_rules(computation, site.name)
                site_alert = None
                if alert_payload is not None:
                    site_alert = alert_repo.create(
                        SiteAlert(
                            site_id=site.id,
                            assessment_id=assessment.id,
                            status=AlertStatus.OPEN.value,
                            **alert_payload,
                        )
                    )
                    total_alerts += 1

                field_obs_specs = [
                    (
                        ObservationType.SPECIES,
                        "Field team confirmed continued presence of indicator species "
                        f"at {site.name}.",
                    ),
                    (
                        ObservationType.HABITAT,
                        f"Routine habitat condition check at {site.name}; cross-referenced "
                        "against the latest analytics snapshot.",
                    ),
                ]
                obs_rnd = random.Random(site_counter * 11)
                for obs_type, notes in field_obs_specs:
                    obs = observation_repo.create(
                        FieldObservation(
                            site_id=site.id,
                            observer_name=ADMIN_NAME,
                            observation_type=obs_type.value,
                            notes=notes,
                            latitude=center_lat,
                            longitude=center_lng,
                            observation_date=today - timedelta(days=obs_rnd.randint(1, 60)),
                        )
                    )
                    total_field_observations += 1
                    log_audit(
                        project_id=project.id,
                        site_id=site.id,
                        action_type="created",
                        entity_type="field_observation",
                        entity_id=obs.id,
                        summary=(
                            f"{ADMIN_NAME} logged a {obs_type.value} field observation "
                            f"for {site.name}."
                        ),
                    )

                if site_alert is not None:
                    action = action_repo.create(
                        ConservationAction(
                            site_id=site.id,
                            alert_id=site_alert.id,
                            title=f"Investigate {site_alert.severity} alert at {site.name}",
                            description=site_alert.recommendation,
                            action_category=ActionCategory.RISK_INVESTIGATION.value,
                            # AlertSeverity and ActionPriority share the same
                            # value set (low/medium/high/critical).
                            priority=site_alert.severity,
                            status=ActionStatus.PLANNED.value,
                            due_date=today + timedelta(days=14),
                        )
                    )
                    total_actions += 1
                    log_audit(
                        project_id=project.id,
                        site_id=site.id,
                        action_type="created",
                        entity_type="action",
                        entity_id=action.id,
                        summary=(
                            f"{ADMIN_NAME} created a {action.priority.title()}-priority "
                            f"{action.action_category} action for {site.name}."
                        ),
                    )

                    if not demo_status_transition_done:
                        action.status = ActionStatus.IN_PROGRESS.value
                        action = action_repo.update(action)
                        log_audit(
                            project_id=project.id,
                            site_id=site.id,
                            action_type="updated",
                            entity_type="action",
                            entity_id=action.id,
                            summary=(
                                f"{ADMIN_NAME} marked the '{action.title}' action as "
                                f"in progress for {site.name}."
                            ),
                        )
                        demo_status_transition_done = True

                    if not demo_alert_ack_done:
                        site_alert.status = AlertStatus.ACKNOWLEDGED.value
                        site_alert.reviewer_note = (
                            "Reviewed during seed data generation; monitoring closely."
                        )
                        site_alert = alert_repo.update(site_alert)
                        log_audit(
                            project_id=project.id,
                            site_id=site.id,
                            action_type="acknowledged",
                            entity_type="alert",
                            entity_id=site_alert.id,
                            summary=(
                                f"{ADMIN_NAME} acknowledged a {site_alert.severity} alert "
                                f"on {site.name}."
                            ),
                        )
                        demo_alert_ack_done = True

        if total_alerts == 0 and first_site is not None:
            # Guarantee at least one alert -> conservation-action pairing for
            # the demo even if this particular random seed happened to
            # produce analytics that don't naturally cross any alert
            # threshold for any site.
            fallback_assessment = assessment_repo.get_latest_for_site(first_site.id)
            fallback_alert = alert_repo.create(
                SiteAlert(
                    site_id=first_site.id,
                    assessment_id=fallback_assessment.id if fallback_assessment else None,
                    severity="medium",
                    title=f"Medium alert: {first_site.name}",
                    description="Nature Health Score: below the healthy threshold.",
                    reasons=["Nature Health Score dropped below the healthy threshold."],
                    recommendation=(
                        "Review the site's Nature Health Score trend and prioritize a "
                        "follow-up assessment."
                    ),
                    status=AlertStatus.OPEN.value,
                )
            )
            total_alerts += 1
            fallback_action = action_repo.create(
                ConservationAction(
                    site_id=first_site.id,
                    alert_id=fallback_alert.id,
                    title=f"Investigate alert at {first_site.name}",
                    description=fallback_alert.recommendation,
                    action_category=ActionCategory.RISK_INVESTIGATION.value,
                    priority=ActionPriority.MEDIUM.value,
                    status=ActionStatus.PLANNED.value,
                    due_date=today + timedelta(days=14),
                )
            )
            total_actions += 1
            log_audit(
                project_id=first_site_project_id,
                site_id=first_site.id,
                action_type="created",
                entity_type="action",
                entity_id=fallback_action.id,
                summary=(
                    f"{ADMIN_NAME} created a Medium-priority Risk Investigation action "
                    f"for {first_site.name}."
                ),
            )

        print()
        print("Seed complete:")
        print(f"  Projects: {len(PROJECTS_SPEC)}")
        print(f"  Sites: {total_sites}")
        print(f"  Analytics records: {total_analytics}")
        print(f"  Species observations: {total_observations}")
        print(f"  Risk assessments: {total_assessments}")
        print(f"  Alerts: {total_alerts}")
        print(f"  Field observations: {total_field_observations}")
        print(f"  Conservation actions: {total_actions}")
        print(f"  Audit log entries: {audit_count}")
        print()
        print(f"Login with: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
