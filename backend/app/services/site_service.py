import uuid
from typing import Any

from fastapi import HTTPException, status
from geoalchemy2.shape import from_shape, to_shape
from shapely.errors import ShapelyError
from shapely.geometry import mapping, shape
from shapely.geometry.base import BaseGeometry
from sqlalchemy.orm import Session

from app.models.site import Site
from app.repositories.analytics_repository import AnalyticsRepository
from app.repositories.project_repository import ProjectRepository
from app.repositories.site_repository import SiteRepository
from app.schemas.site import (
    LatestSnapshot,
    ProjectSummary,
    SiteCreate,
    SiteRead,
    SiteUpdate,
)

_ALLOWED_GEOJSON_TYPES = {"Polygon", "MultiPolygon"}


def _validate_and_convert_geometry(geojson: dict[str, Any]) -> BaseGeometry:
    if not isinstance(geojson, dict) or "type" not in geojson or "coordinates" not in geojson:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="boundary must be a GeoJSON object with 'type' and 'coordinates'",
        )
    if geojson.get("type") not in _ALLOWED_GEOJSON_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="boundary.type must be 'Polygon' or 'MultiPolygon'",
        )
    try:
        geom = shape(geojson)
    except (ShapelyError, ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid GeoJSON geometry: {exc}",
        ) from exc

    if geom.is_empty:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="boundary geometry must not be empty",
        )
    if not geom.is_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="boundary geometry is invalid or self-intersecting",
        )
    return geom


class SiteService:
    def __init__(self, db: Session):
        self.db = db
        self.sites = SiteRepository(db)
        self.projects = ProjectRepository(db)
        self.analytics = AnalyticsRepository(db)

    def _to_read(self, site: Site, *, include_project: bool = False) -> SiteRead:
        boundary_geojson = mapping(to_shape(site.boundary))
        latest = self.analytics.get_latest_for_site(site.id)
        latest_snapshot = None
        if latest is not None:
            latest_snapshot = LatestSnapshot(
                recorded_at=latest.recorded_at,
                carbon_captured_tco2e=latest.carbon_captured_tco2e,
                biodiversity_score=latest.biodiversity_score,
                species_count=latest.species_count,
                ecosystem_health_score=latest.ecosystem_health_score,
                disturbance_risk=latest.disturbance_risk,
            )

        project_summary = None
        if include_project and site.project is not None:
            project_summary = ProjectSummary(
                id=site.project.id,
                name=site.project.name,
                status=site.project.status,
                color=site.project.color,
            )

        return SiteRead(
            id=site.id,
            project_id=site.project_id,
            name=site.name,
            site_code=site.site_code,
            ecosystem_type=site.ecosystem_type,
            monitoring_status=site.monitoring_status,
            notes=site.notes,
            boundary=boundary_geojson,
            area_hectares=site.area_hectares,
            created_at=site.created_at,
            updated_at=site.updated_at,
            latest_snapshot=latest_snapshot,
            project=project_summary,
        )

    def list_sites(
        self, project_id: uuid.UUID, owner_id: uuid.UUID, *, skip: int = 0, limit: int = 200
    ) -> tuple[list[SiteRead], int]:
        self._get_owned_project_or_404(project_id, owner_id)
        items, total = self.sites.list_for_project(project_id, skip=skip, limit=limit)
        return [self._to_read(s) for s in items], total

    def create_site(
        self, project_id: uuid.UUID, owner_id: uuid.UUID, payload: SiteCreate
    ) -> SiteRead:
        self._get_owned_project_or_404(project_id, owner_id)

        if self.sites.is_site_code_taken(payload.site_code):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="site_code already exists"
            )

        geometry = _validate_and_convert_geometry(payload.boundary)

        site = Site(
            project_id=project_id,
            name=payload.name,
            site_code=payload.site_code,
            ecosystem_type=payload.ecosystem_type,
            monitoring_status=payload.monitoring_status,
            notes=payload.notes,
            boundary=from_shape(geometry, srid=4326),
        )
        site = self.sites.create(site)
        site = self.sites.get_by_id_for_owner(site.id, owner_id)
        return self._to_read(site)

    def get_site(self, site_id: uuid.UUID, owner_id: uuid.UUID) -> SiteRead:
        site = self._get_owned_site_or_404(site_id, owner_id)
        return self._to_read(site, include_project=True)

    def update_site(self, site_id: uuid.UUID, owner_id: uuid.UUID, payload: SiteUpdate) -> SiteRead:
        site = self._get_owned_site_or_404(site_id, owner_id)
        data = payload.model_dump(exclude_unset=True)

        if (
            "site_code" in data
            and data["site_code"] != site.site_code
            and self.sites.is_site_code_taken(data["site_code"], exclude_id=site.id)
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="site_code already exists",
            )

        if "boundary" in data:
            geometry = _validate_and_convert_geometry(data.pop("boundary"))
            site.boundary = from_shape(geometry, srid=4326)

        for field, value in data.items():
            setattr(site, field, value)

        site = self.sites.update(site)
        site = self.sites.get_by_id_for_owner(site.id, owner_id)
        return self._to_read(site, include_project=True)

    def delete_site(self, site_id: uuid.UUID, owner_id: uuid.UUID) -> None:
        site = self._get_owned_site_or_404(site_id, owner_id)
        self.sites.delete(site)

    def _get_owned_project_or_404(self, project_id: uuid.UUID, owner_id: uuid.UUID):
        project = self.projects.get_by_id_for_owner(project_id, owner_id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        return project

    def _get_owned_site_or_404(self, site_id: uuid.UUID, owner_id: uuid.UUID) -> Site:
        site = self.sites.get_by_id_for_owner(site_id, owner_id)
        if site is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")
        return site
