# Darukaa.Earth — API Contract (source of truth)

This document is the binding contract between the FastAPI backend and the React frontend.
Both sides MUST match these shapes exactly. Base URL prefix for all endpoints: `/api/v1`.
Unauthenticated health check lives at `/health` (no prefix).

## Conventions

- All IDs are UUID v4 strings.
- All timestamps are ISO-8601 UTC strings (e.g. `2026-01-15T10:30:00Z`).
- All dates (no time) are `YYYY-MM-DD`.
- Auth: `Authorization: Bearer <access_token>` header on all protected routes.
- Error body shape (FastAPI default): `{ "detail": "message" }` for simple errors, or
  `{ "detail": [{ "loc": [...], "msg": "...", "type": "..." }] }` for pydantic validation errors (422).
- CORS allows the frontend origin from `FRONTEND_ORIGIN` env var.

## Enums

```
ProjectType: "mangrove_restoration" | "forest_conservation" | "agroforestry" | "wetland_restoration" | "grassland_restoration"
ProjectStatus: "planning" | "active" | "monitoring" | "completed"
EcosystemType: "mangrove" | "forest" | "wetland" | "grassland" | "agroforestry"
MonitoringStatus: "active" | "paused" | "needs_review" | "completed"
ObservationCategory: "Bird" | "Mammal" | "Reptile" | "Amphibian" | "Plant" | "Insect"
AnalyticsRange: "3m" | "6m" | "12m" | "all"
```

## Auth

### POST /api/v1/auth/register
Request: `{ "full_name": string, "email": string, "password": string (min 8) }`
201 Response:
```json
{ "id": "uuid", "full_name": "string", "email": "string", "is_active": true, "created_at": "iso" }
```
409 if email already registered.

### POST /api/v1/auth/login
Request: `{ "email": string, "password": string }`
200 Response:
```json
{ "access_token": "jwt", "refresh_token": "jwt", "token_type": "bearer", "expires_in": 900 }
```
401 on invalid credentials.

### POST /api/v1/auth/refresh
Request: `{ "refresh_token": string }`
200 Response: same shape as login response (rotates refresh token).
401 if refresh token invalid/expired.

### GET /api/v1/auth/me
200 Response: `{ "id": "uuid", "full_name": "string", "email": "string", "is_active": true, "created_at": "iso" }`

## Projects

Computed fields returned on every Project representation (derived server-side from its sites/analytics):
`site_count` (int), `total_area_hectares` (float), `total_carbon_tco2e` (float), `avg_biodiversity_score` (float|null).

### GET /api/v1/projects?search=&status=
200: `{ "items": [Project...], "total": number }`

### POST /api/v1/projects
Request:
```json
{
  "name": "string", "description": "string",
  "country": "string", "region": "string",
  "project_type": ProjectType, "status": ProjectStatus,
  "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD|null",
  "color": "#RRGGBB"
}
```
201: Project object.

### GET /api/v1/projects/{project_id} — 200: Project (with computed fields). 404 if not found or not owned.

### PATCH /api/v1/projects/{project_id} — partial update of the same fields. 200: Project.

### DELETE /api/v1/projects/{project_id} — 204. Cascades to sites/analytics/observations.

Project object shape:
```json
{
  "id": "uuid", "owner_id": "uuid", "name": "string", "description": "string",
  "country": "string", "region": "string", "project_type": "forest_conservation",
  "status": "active", "start_date": "2025-01-01", "end_date": null, "color": "#1b4332",
  "created_at": "iso", "updated_at": "iso",
  "site_count": 3, "total_area_hectares": 452.3, "total_carbon_tco2e": 1204.5, "avg_biodiversity_score": 72.4
}
```

## Sites

Site GeoJSON: `boundary` is a GeoJSON `Polygon` or `MultiPolygon` object in WGS84 (EPSG:4326), e.g.
`{ "type": "Polygon", "coordinates": [[[lng, lat], ...]] }`.
`area_hectares` is ALWAYS computed server-side via PostGIS geography area — never trust a client-sent value.

### GET /api/v1/projects/{project_id}/sites — 200: `{ "items": [Site...], "total": number }`

### POST /api/v1/projects/{project_id}/sites
Request:
```json
{
  "name": "string", "site_code": "string (unique)",
  "ecosystem_type": EcosystemType, "monitoring_status": MonitoringStatus,
  "boundary": GeoJSON, "notes": "string|null"
}
```
201: Site object. 422 if boundary is missing/invalid/self-intersecting/not a Polygon|MultiPolygon.

### GET /api/v1/sites/{site_id} — 200: Site (includes `project` summary: id, name, status, color).
### PATCH /api/v1/sites/{site_id} — 200: Site.
### DELETE /api/v1/sites/{site_id} — 204.

Site object shape:
```json
{
  "id": "uuid", "project_id": "uuid", "name": "string", "site_code": "SND-001",
  "ecosystem_type": "mangrove", "monitoring_status": "active", "notes": "string|null",
  "boundary": { "type": "Polygon", "coordinates": [[[..],[..]]] },
  "area_hectares": 128.4, "created_at": "iso", "updated_at": "iso",
  "latest_snapshot": {
    "recorded_at": "iso", "carbon_captured_tco2e": 320.1, "biodiversity_score": 74.2,
    "species_count": 41, "ecosystem_health_score": 81.0, "disturbance_risk": "low"
  }
}
```

## Analytics

### GET /api/v1/sites/{site_id}/analytics?range=3m|6m|12m|all
200:
```json
{
  "site_id": "uuid", "range": "12m",
  "records": [
    {
      "recorded_at": "2025-01-01", "carbon_captured_tco2e": 300.2, "biodiversity_score": 70.1,
      "species_count": 38, "vegetation_cover_percent": 62.5, "soil_moisture_percent": 41.0,
      "ecosystem_health_score": 78.5, "disturbance_risk": "low"
    }
  ],
  "latest": { ...same shape as one record... }
}
```
`disturbance_risk` is one of `"low" | "moderate" | "high"`.

### POST /api/v1/sites/{site_id}/analytics
Request: same fields as one record (minus site_id). 201: created record.

### GET /api/v1/sites/{site_id}/species-observations
200:
```json
{
  "items": [
    { "id": "uuid", "species_name": "string", "scientific_name": "string|null",
      "category": ObservationCategory, "observation_count": 12,
      "observed_at": "iso", "confidence_score": 0.92 }
  ],
  "by_category": { "Bird": 45, "Mammal": 12, "...": 0 }
}
```

## Dashboard

### GET /api/v1/dashboard/summary
200:
```json
{
  "total_projects": 3, "total_active_sites": 6, "total_area_hectares": 1345.2,
  "total_carbon_tco2e": 4820.6, "avg_biodiversity_score": 71.3, "total_species_observed": 187,
  "recent_projects": [ { "id","name","status","site_count","updated_at" } ],
  "recent_site_activity": [ { "id","name","project_name","monitoring_status","updated_at" } ]
}
```

### GET /api/v1/dashboard/map-sites
200:
```json
{
  "items": [
    {
      "id": "uuid", "name": "string", "project_id": "uuid", "project_name": "string",
      "project_status": "active", "project_color": "#1b4332",
      "boundary": GeoJSON, "area_hectares": 128.4,
      "ecosystem_health_score": 81.0, "latest_carbon_tco2e": 320.1
    }
  ]
}
```

## Health

### GET /health — 200: `{ "status": "ok" }` (no auth, no prefix).

## Ownership rule

Every project/site/analytics/observation query is scoped to `owner_id == current_user.id` via the
project the site belongs to. Any attempt to access another user's resource returns `404 Not Found`
(never 403, to avoid leaking existence).
