import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.dependencies.pagination import pagination_params
from app.models.enums import ProjectStatus
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectListResponse, ProjectRead, ProjectUpdate
from app.services.project_service import ProjectService

router = APIRouter()


@router.get("", response_model=ProjectListResponse)
def list_projects(
    search: str | None = Query(default=None),
    status: ProjectStatus | None = Query(default=None),
    pagination: dict = Depends(pagination_params),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectListResponse:
    items, total = ProjectService(db).list_projects(
        current_user.id,
        search=search,
        status_filter=status,
        skip=pagination["skip"],
        limit=pagination["limit"],
    )
    return ProjectListResponse(items=items, total=total)


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectRead:
    return ProjectService(db).create_project(current_user.id, payload)


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectRead:
    return ProjectService(db).get_project(project_id, current_user.id)


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectRead:
    return ProjectService(db).update_project(project_id, current_user.id, payload)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    ProjectService(db).delete_project(project_id, current_user.id)
