from fastapi import APIRouter

from app.api.v1 import (
    actions,
    alerts,
    analytics,
    audit_logs,
    auth,
    dashboard,
    field_observations,
    projects,
    risk_assessments,
    sites,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(sites.router, tags=["sites"])
api_router.include_router(analytics.router, tags=["analytics"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])

# New in FEATURE_CONTRACT_V2 -- see docs/FEATURE_CONTRACT_V2.md. Each of these
# routers defines its own full paths (like sites/analytics above) rather than
# taking a prefix here.
api_router.include_router(risk_assessments.router, tags=["risk-assessment"])
api_router.include_router(alerts.router, tags=["alerts"])
api_router.include_router(field_observations.router, tags=["field-observations"])
api_router.include_router(actions.router, tags=["actions"])
api_router.include_router(audit_logs.router, tags=["audit-logs"])
