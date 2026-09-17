from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.user import User
from app.schemas.dashboard import DashboardSummary, MapSitesResponse
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> DashboardSummary:
    return DashboardService(db).get_summary(current_user.id)


@router.get("/map-sites", response_model=MapSitesResponse)
def get_map_sites(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> MapSitesResponse:
    return DashboardService(db).get_map_sites(current_user.id)
