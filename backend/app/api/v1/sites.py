import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.dependencies.pagination import pagination_params
from app.models.user import User
from app.schemas.site import SiteCreate, SiteListResponse, SiteRead, SiteUpdate
from app.services.site_service import SiteService

router = APIRouter()


@router.get("/projects/{project_id}/sites", response_model=SiteListResponse)
def list_sites(
    project_id: uuid.UUID,
    pagination: dict = Depends(pagination_params),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SiteListResponse:
    items, total = SiteService(db).list_sites(
        project_id, current_user.id, skip=pagination["skip"], limit=pagination["limit"]
    )
    return SiteListResponse(items=items, total=total)


@router.post(
    "/projects/{project_id}/sites", response_model=SiteRead, status_code=status.HTTP_201_CREATED
)
def create_site(
    project_id: uuid.UUID,
    payload: SiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SiteRead:
    return SiteService(db).create_site(project_id, current_user.id, payload)


@router.get("/sites/{site_id}", response_model=SiteRead)
def get_site(
    site_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SiteRead:
    return SiteService(db).get_site(site_id, current_user.id)


@router.patch("/sites/{site_id}", response_model=SiteRead)
def update_site(
    site_id: uuid.UUID,
    payload: SiteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SiteRead:
    return SiteService(db).update_site(site_id, current_user.id, payload)


@router.delete("/sites/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_site(
    site_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    SiteService(db).delete_site(site_id, current_user.id)
