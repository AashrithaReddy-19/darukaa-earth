import uuid

from geoalchemy2.shape import to_shape
from shapely.geometry import mapping
from sqlalchemy.orm import Session

from app.models.enums import MonitoringStatus
from app.repositories.analytics_repository import AnalyticsRepository
from app.repositories.observation_repository import ObservationRepository
from app.repositories.project_repository import ProjectRepository
from app.repositories.site_repository import SiteRepository
from app.schemas.dashboard import (
    DashboardSummary,
    MapSiteItem,
    MapSitesResponse,
    RecentProject,
    RecentSiteActivity,
)

_RECENT_LIMIT = 5


class DashboardService:
    def __init__(self, db: Session):
        self.db = db
        self.projects = ProjectRepository(db)
        self.sites = SiteRepository(db)
        self.analytics = AnalyticsRepository(db)
        self.observations = ObservationRepository(db)

    def get_summary(self, owner_id: uuid.UUID) -> DashboardSummary:
        projects, total_projects = self.projects.list_for_owner(owner_id, skip=0, limit=10_000)
        project_ids = [p.id for p in projects]
        sites = self.sites.list_for_project_ids(project_ids)
        site_ids = [s.id for s in sites]
        latest_map = self.analytics.get_latest_for_sites(site_ids)

        total_active_sites = sum(1 for s in sites if s.monitoring_status == MonitoringStatus.ACTIVE)
        total_area_hectares = sum(s.area_hectares or 0.0 for s in sites)

        carbon_values = [
            latest_map[sid].carbon_captured_tco2e for sid in site_ids if sid in latest_map
        ]
        biodiversity_values = [
            latest_map[sid].biodiversity_score for sid in site_ids if sid in latest_map
        ]
        total_carbon_tco2e = sum(carbon_values)
        avg_biodiversity_score = (
            round(sum(biodiversity_values) / len(biodiversity_values), 2)
            if biodiversity_values
            else None
        )
        total_species_observed = self.observations.total_count_for_owner(owner_id)

        project_by_id = {p.id: p for p in projects}
        site_counts: dict[uuid.UUID, int] = {}
        for s in sites:
            site_counts[s.project_id] = site_counts.get(s.project_id, 0) + 1

        recent_projects_sorted = sorted(projects, key=lambda p: p.updated_at, reverse=True)[
            :_RECENT_LIMIT
        ]
        recent_projects = [
            RecentProject(
                id=p.id,
                name=p.name,
                status=p.status,
                site_count=site_counts.get(p.id, 0),
                updated_at=p.updated_at,
            )
            for p in recent_projects_sorted
        ]

        recent_sites_sorted = sorted(sites, key=lambda s: s.updated_at, reverse=True)[
            :_RECENT_LIMIT
        ]
        recent_site_activity = [
            RecentSiteActivity(
                id=s.id,
                name=s.name,
                project_name=(
                    project_by_id[s.project_id].name if s.project_id in project_by_id else ""
                ),
                monitoring_status=s.monitoring_status,
                updated_at=s.updated_at,
            )
            for s in recent_sites_sorted
        ]

        return DashboardSummary(
            total_projects=total_projects,
            total_active_sites=total_active_sites,
            total_area_hectares=round(total_area_hectares, 2),
            total_carbon_tco2e=round(total_carbon_tco2e, 2),
            avg_biodiversity_score=avg_biodiversity_score,
            total_species_observed=total_species_observed,
            recent_projects=recent_projects,
            recent_site_activity=recent_site_activity,
        )

    def get_map_sites(self, owner_id: uuid.UUID) -> MapSitesResponse:
        projects, _ = self.projects.list_for_owner(owner_id, skip=0, limit=10_000)
        project_by_id = {p.id: p for p in projects}
        sites = self.sites.list_for_project_ids(list(project_by_id.keys()))
        site_ids = [s.id for s in sites]
        latest_map = self.analytics.get_latest_for_sites(site_ids)

        items: list[MapSiteItem] = []
        for site in sites:
            project = project_by_id.get(site.project_id)
            if project is None:
                continue
            latest = latest_map.get(site.id)
            items.append(
                MapSiteItem(
                    id=site.id,
                    name=site.name,
                    project_id=project.id,
                    project_name=project.name,
                    project_status=project.status,
                    project_color=project.color,
                    boundary=mapping(to_shape(site.boundary)),
                    area_hectares=site.area_hectares,
                    ecosystem_health_score=latest.ecosystem_health_score if latest else None,
                    latest_carbon_tco2e=latest.carbon_captured_tco2e if latest else None,
                )
            )

        return MapSitesResponse(items=items)
