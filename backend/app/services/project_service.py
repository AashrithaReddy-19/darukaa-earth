import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enums import ProjectStatus
from app.models.project import Project
from app.repositories.analytics_repository import AnalyticsRepository
from app.repositories.project_repository import ProjectRepository
from app.repositories.site_repository import SiteRepository
from app.repositories.user_repository import UserRepository
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.services.audit_log_service import record_audit_event


class ProjectService:
    def __init__(self, db: Session):
        self.db = db
        self.projects = ProjectRepository(db)
        self.sites = SiteRepository(db)
        self.analytics = AnalyticsRepository(db)
        self.users = UserRepository(db)

    def _aggregates_for(self, project_ids: list[uuid.UUID]) -> dict[uuid.UUID, dict]:
        """Compute site_count / total_area_hectares / total_carbon_tco2e /
        avg_biodiversity_score for each project id, based on each site's most
        recent analytics snapshot.
        """
        result: dict[uuid.UUID, dict] = {
            pid: {
                "site_count": 0,
                "total_area_hectares": 0.0,
                "total_carbon_tco2e": 0.0,
                "avg_biodiversity_score": None,
            }
            for pid in project_ids
        }
        if not project_ids:
            return result

        sites = self.sites.list_for_project_ids(project_ids)
        site_ids = [s.id for s in sites]
        latest_map = self.analytics.get_latest_for_sites(site_ids)

        carbon_by_project: dict[uuid.UUID, list[float]] = {pid: [] for pid in project_ids}
        biodiversity_by_project: dict[uuid.UUID, list[float]] = {pid: [] for pid in project_ids}

        for site in sites:
            agg = result[site.project_id]
            agg["site_count"] += 1
            agg["total_area_hectares"] += site.area_hectares or 0.0
            latest = latest_map.get(site.id)
            if latest is not None:
                carbon_by_project[site.project_id].append(latest.carbon_captured_tco2e)
                biodiversity_by_project[site.project_id].append(latest.biodiversity_score)

        for pid in project_ids:
            agg = result[pid]
            agg["total_area_hectares"] = round(agg["total_area_hectares"], 2)
            agg["total_carbon_tco2e"] = round(sum(carbon_by_project[pid]), 2)
            biodiversity_values = biodiversity_by_project[pid]
            agg["avg_biodiversity_score"] = (
                round(sum(biodiversity_values) / len(biodiversity_values), 2)
                if biodiversity_values
                else None
            )

        return result

    def _to_read(self, project: Project, aggregates: dict[uuid.UUID, dict]) -> ProjectRead:
        agg = aggregates.get(
            project.id,
            {
                "site_count": 0,
                "total_area_hectares": 0.0,
                "total_carbon_tco2e": 0.0,
                "avg_biodiversity_score": None,
            },
        )
        return ProjectRead(
            id=project.id,
            owner_id=project.owner_id,
            name=project.name,
            description=project.description,
            country=project.country,
            region=project.region,
            project_type=project.project_type,
            status=project.status,
            start_date=project.start_date,
            end_date=project.end_date,
            color=project.color,
            created_at=project.created_at,
            updated_at=project.updated_at,
            **agg,
        )

    def list_projects(
        self,
        owner_id: uuid.UUID,
        *,
        search: str | None = None,
        status_filter: ProjectStatus | None = None,
        skip: int = 0,
        limit: int = 200,
    ) -> tuple[list[ProjectRead], int]:
        items, total = self.projects.list_for_owner(
            owner_id, search=search, status=status_filter, skip=skip, limit=limit
        )
        aggregates = self._aggregates_for([p.id for p in items])
        return [self._to_read(p, aggregates) for p in items], total

    def get_project(self, project_id: uuid.UUID, owner_id: uuid.UUID) -> ProjectRead:
        project = self.get_owned_project_or_404(project_id, owner_id)
        aggregates = self._aggregates_for([project.id])
        return self._to_read(project, aggregates)

    def create_project(self, owner_id: uuid.UUID, payload: ProjectCreate) -> ProjectRead:
        project = Project(owner_id=owner_id, **payload.model_dump())
        project = self.projects.create(project)
        self._record_project_audit(project, owner_id, action_type="created")
        aggregates = self._aggregates_for([project.id])
        return self._to_read(project, aggregates)

    def update_project(
        self, project_id: uuid.UUID, owner_id: uuid.UUID, payload: ProjectUpdate
    ) -> ProjectRead:
        project = self.get_owned_project_or_404(project_id, owner_id)
        data = payload.model_dump(exclude_unset=True)
        for field, value in data.items():
            setattr(project, field, value)
        project = self.projects.update(project)
        self._record_project_audit(project, owner_id, action_type="updated")
        aggregates = self._aggregates_for([project.id])
        return self._to_read(project, aggregates)

    def _record_project_audit(
        self, project: Project, owner_id: uuid.UUID, *, action_type: str
    ) -> None:
        """Audit-log side effect for FEATURE_CONTRACT_V2's audit log feature.

        Purely additive -- does not change this service's return values.
        """
        user = self.users.get_by_id(owner_id)
        full_name = user.full_name if user is not None else "A user"
        record_audit_event(
            self.db,
            user_id=owner_id,
            project_id=project.id,
            site_id=None,
            action_type=action_type,
            entity_type="project",
            entity_id=project.id,
            summary=f"{full_name} {action_type} the project '{project.name}'.",
        )

    def delete_project(self, project_id: uuid.UUID, owner_id: uuid.UUID) -> None:
        project = self.get_owned_project_or_404(project_id, owner_id)
        self.projects.delete(project)

    def get_owned_project_or_404(self, project_id: uuid.UUID, owner_id: uuid.UUID) -> Project:
        project = self.projects.get_by_id_for_owner(project_id, owner_id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        return project
