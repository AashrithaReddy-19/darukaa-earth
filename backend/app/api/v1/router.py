from fastapi import APIRouter

from app.api.v1 import analytics, auth, dashboard, projects, sites

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(sites.router, tags=["sites"])
api_router.include_router(analytics.router, tags=["analytics"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
