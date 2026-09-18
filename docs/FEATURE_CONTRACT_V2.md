# Darukaa.Earth — Feature Extension Contract (v2)

Binding contract for five new features added on top of the existing, deployed Darukaa.Earth
app. Both the backend and frontend agents implementing this MUST follow it exactly — they will
not see each other's code. Read `docs/API_CONTRACT.md` first for the existing v1 shapes; nothing
in that file changes. All new routes live under the same `/api/v1` prefix.

**Every generated/derived value introduced here (scores, alerts, summaries, seeded observations,
actions) is demo intelligence data** — deterministic, rule-based, computed from the existing
seeded analytics. Nothing here is a trained ML model or real sensor/satellite feed, and the UI
must say so wherever these values are shown (a small "Demo intelligence data" badge, same visual
language as the existing "Demo monitoring data" badge on the analytics page).

## New enums

```
ScoreBand: "healthy" | "watch" | "at_risk" | "critical"
AlertSeverity: "low" | "medium" | "high" | "critical"
AlertStatus: "open" | "acknowledged" | "resolved"
ObservationType: "Species" | "Habitat" | "Threat" | "Restoration Activity" | "Other"
ActionCategory: "Field Survey" | "Habitat Restoration" | "Community Engagement" | "Monitoring" | "Risk Investigation"
ActionPriority: "low" | "medium" | "high" | "critical"
ActionStatus: "planned" | "in_progress" | "completed" | "cancelled"
```

## Feature 1 — Nature Health Score & Alerts

### Scoring inputs

For a given site, pull its `site_analytics` records ordered by `recorded_at`. Define:
- `latest` = most recent record.
- `baseline` = the record closest to (but not after) `latest.recorded_at - 3 months`; if fewer
  than 2 records exist total, `baseline = latest` (all trends become 0%, score still computable
  from `latest` alone).

### Component scores (each normalized to 0–100, higher = better)

1. **Ecosystem health (weight 25%)**: `latest.ecosystem_health_score` directly (already 0–100).
2. **Biodiversity trend (weight 20%)**: `pct = (latest.biodiversity_score - baseline.biodiversity_score) / max(baseline.biodiversity_score, 1) * 100`, then `score = clamp(50 + pct * 2, 0, 100)`.
3. **Vegetation trend (weight 15%)**: same formula as #2 using `vegetation_cover_percent`.
4. **Carbon trend (weight 15%)**: same formula as #2 using `carbon_captured_tco2e`.
5. **Soil moisture (weight 10%)**: `latest.soil_moisture_percent` directly, clamped 0–100.
6. **Human disturbance risk (weight 10%)**: map `latest.disturbance_risk` → `low`: 100, `moderate`: 55, `high`: 10.
7. **Species-observation trend (weight 5%)**: same formula as #2 using `species_count`.

`nature_health_score = round(clamp(sum(component_i * weight_i), 0, 100))` (weights sum to 1.0).
This is a **deterministic weighted formula, not a trained AI/ML model** — say so in code comments,
API descriptions, and the UI explanation panel.

### Score band (deterministic thresholds)

```
score >= 80            -> "healthy"
65 <= score < 80        -> "watch"
45 <= score < 65        -> "at_risk"
score < 45              -> "critical"
```

### Trend fields stored on the assessment

`carbon_trend`, `biodiversity_trend`, `vegetation_trend`, `soil_moisture_trend` are all stored as
the **percentage change** used above (`pct`, a float, e.g. `-12.4` meaning a 12.4% decline over
the baseline→latest window). `soil_moisture_trend` uses the same pct-change formula against
`soil_moisture_percent` (distinct from the raw `soil_moisture_percent` score component).

### Alert generation rules

Run whenever a risk assessment is (re)calculated for a site. Evaluate ALL of the following
conditions against the same `latest`/`baseline` pair used for scoring; each true condition
contributes one bullet to a single combined alert for that assessment run (matching the
worked example in the product brief — one alert, multiple reasons), not one alert per condition:

- `nature_health_score < 70` → reason: `"Nature Health Score dropped to {score}/100 ({band})."`
- vegetation cover dropped more than 8% over the window (`vegetation_trend <= -8`) → reason:
  `"Vegetation cover decreased by {abs(vegetation_trend):.0f}% in the last three months."`
- biodiversity dropped more than 5 **points** (absolute, not %) over the window
  (`latest.biodiversity_score - baseline.biodiversity_score <= -5`) → reason:
  `"Biodiversity score decreased by {points:.0f} points."`
- `latest.disturbance_risk == "high"` → reason:
  `"Disturbance risk is High."` (if risk increased from a lower baseline value, phrase as
  `"Disturbance risk increased from {baseline_risk} to High."`)
- soil moisture critically low (`latest.soil_moisture_percent < 20`) → reason:
  `"Soil moisture is critically low at {value:.0f}%."`
- species observations reduced significantly (`species-observation trend <= -15`) → reason:
  `"Species observations declined by {abs(pct):.0f}% in the last three months."`

If zero conditions trigger, **do not create an alert** for that run (the assessment is still
saved). If one or more trigger, create exactly one `site_alerts` row:
- `severity`: `critical` if the disturbance-risk-high condition or `score < 45` triggered,
  else `high` if `score < 65` or the vegetation/biodiversity/soil-moisture conditions triggered,
  else `medium` if only `score < 70` or the species-decline condition triggered, else `low`
  (pick the single highest severity implied across all triggered conditions).
- `title`: `"{severity title-case} alert: {site.name}"`.
- `description`: one paragraph combining the nature health score line, e.g.
  `"Nature Health Score: {score}/100."`
- `reasons`: JSON array of the reason strings above, in the order listed.
- `recommendation`: a template chosen by which conditions fired (documented list of ~6 template
  strings covering the condition set, e.g. disturbance-risk → `"Schedule a field survey and
  inspect possible illegal activity or habitat disturbance."`; low soil moisture → `"Investigate
  irrigation/water table changes and consider a hydrology survey."`; combine with `" "` if
  multiple apply, capped at 2 sentences).
- `status`: `"open"`.

Do not create a duplicate open alert for the same site if an open alert from the same
`assessment_id` chain already exists unresolved for the same triggered condition set — simplest
safe rule: **skip creating a new alert if the site already has an `open` alert created within the
last 24h**, to avoid alert spam on repeated recalculation; still always save the new
`site_risk_assessments` row.

## Database tables (new Alembic migration, do not touch migration `0001`)

```
site_risk_assessments
  id UUID PK
  site_id UUID FK sites(id) ON DELETE CASCADE, indexed
  nature_health_score FLOAT NOT NULL
  score_band VARCHAR NOT NULL
  carbon_trend FLOAT NOT NULL
  biodiversity_trend FLOAT NOT NULL
  vegetation_trend FLOAT NOT NULL
  soil_moisture_trend FLOAT NOT NULL
  disturbance_risk VARCHAR NOT NULL      -- snapshot of latest.disturbance_risk at calc time
  calculated_at TIMESTAMPTZ NOT NULL server_default now()

site_alerts
  id UUID PK
  site_id UUID FK sites(id) ON DELETE CASCADE, indexed
  assessment_id UUID FK site_risk_assessments(id) ON DELETE CASCADE, nullable
  severity VARCHAR NOT NULL
  title VARCHAR NOT NULL
  description TEXT NOT NULL
  reasons JSON NOT NULL                  -- array of strings
  recommendation TEXT NOT NULL
  status VARCHAR NOT NULL DEFAULT 'open'
  reviewer_note TEXT NULLABLE
  created_at TIMESTAMPTZ NOT NULL server_default now()
  updated_at TIMESTAMPTZ NOT NULL server_default now()

field_observations
  id UUID PK
  site_id UUID FK sites(id) ON DELETE CASCADE, indexed
  observer_name VARCHAR NOT NULL
  observation_type VARCHAR NOT NULL
  notes TEXT NOT NULL
  latitude FLOAT NULLABLE
  longitude FLOAT NULLABLE
  observation_date DATE NOT NULL
  created_at TIMESTAMPTZ NOT NULL server_default now()

conservation_actions
  id UUID PK
  site_id UUID FK sites(id) ON DELETE CASCADE, indexed
  alert_id UUID FK site_alerts(id) ON DELETE SET NULL, nullable
  title VARCHAR NOT NULL
  description TEXT NOT NULL
  action_category VARCHAR NOT NULL
  priority VARCHAR NOT NULL
  status VARCHAR NOT NULL DEFAULT 'planned'
  due_date DATE NULLABLE
  created_at TIMESTAMPTZ NOT NULL server_default now()
  updated_at TIMESTAMPTZ NOT NULL server_default now()

audit_logs
  id UUID PK
  user_id UUID FK users(id) ON DELETE SET NULL, nullable, indexed
  project_id UUID FK projects(id) ON DELETE SET NULL, nullable, indexed
  site_id UUID FK sites(id) ON DELETE SET NULL, nullable, indexed
  action_type VARCHAR NOT NULL          -- e.g. "created", "updated", "acknowledged", "resolved"
  entity_type VARCHAR NOT NULL          -- e.g. "project", "site", "analytics", "alert", "action"
  entity_id UUID NOT NULL
  summary VARCHAR NOT NULL              -- human-readable, e.g. "Aashritha created a High-priority
                                         -- field survey action for Sundarbans Site A."
  metadata JSON NULLABLE                -- small structured extra context; NEVER secrets/tokens
  created_at TIMESTAMPTZ NOT NULL server_default now()
```

`audit_logs` has no UPDATE/DELETE exposed anywhere in the API — insert-only from the service
layer, read-only endpoints. Never write passwords, JWTs, DB connection strings, or the Mapbox
token into `metadata` or `summary`.

## New API endpoints (all require auth; all scoped to the current user's own projects/sites,
404 — not 403 — on any cross-user access, matching the existing convention)

### Risk assessment & alerts

```
GET  /api/v1/sites/{site_id}/risk-assessment
  -> latest assessment for the site, or 404 if none calculated yet:
  { "id", "site_id", "nature_health_score", "score_band",
    "carbon_trend", "biodiversity_trend", "vegetation_trend", "soil_moisture_trend",
    "disturbance_risk", "calculated_at",
    "components": { "ecosystem_health": <0-100>, "biodiversity_trend": <0-100>,
                     "vegetation_trend": <0-100>, "carbon_trend": <0-100>,
                     "soil_moisture": <0-100>, "disturbance_risk": <0-100>,
                     "species_trend": <0-100> },
    "weights": { "ecosystem_health": 0.25, "biodiversity_trend": 0.20, "vegetation_trend": 0.15,
                 "carbon_trend": 0.15, "soil_moisture": 0.10, "disturbance_risk": 0.10,
                 "species_trend": 0.05 } }
  (components + weights are included so the frontend can render the "why this score?" panel
  without re-deriving the math)

POST /api/v1/sites/{site_id}/risk-assessment/recalculate
  -> recomputes from current site_analytics, saves a new site_risk_assessments row, evaluates
     alert rules, returns the same shape as GET above. 201.

GET  /api/v1/alerts?severity=&status=&site_id=
  -> { "items": [ { "id","site_id","site_name","project_id","project_name","assessment_id",
                     "severity","title","description","reasons","recommendation","status",
                     "reviewer_note","created_at","updated_at" } ], "total": number }
  scoped to sites under the current user's projects only.

PATCH /api/v1/alerts/{alert_id}
  body: { "status": AlertStatus, "reviewer_note": string|null }  (both optional, partial update)
  -> updated alert (same shape as list item). Writes an audit_logs row
  ("acknowledged"/"resolved" action_type) when status changes.

GET  /api/v1/dashboard/alerts-summary
  -> { "open_count": n, "acknowledged_count": n, "resolved_count": n,
       "by_severity": { "low": n, "medium": n, "high": n, "critical": n },
       "recent": [ <same shape as an alert list item>, ... up to 5, newest first ] }
```

### Field observations

```
GET  /api/v1/sites/{site_id}/field-observations?observation_type=
  -> { "items": [ { "id","site_id","observer_name","observation_type","notes",
                     "latitude","longitude","observation_date","created_at" } ], "total": n }

POST /api/v1/sites/{site_id}/field-observations
  body: { "observer_name","observation_type","notes","latitude"?,"longitude"?,"observation_date" }
  -> 201, created observation. Writes an audit_logs row.
```

### Conservation actions

```
GET  /api/v1/actions?status=&site_id=
  -> { "items": [ { "id","site_id","site_name","project_id","project_name","alert_id",
                     "title","description","action_category","priority","status","due_date",
                     "created_at","updated_at" } ], "total": n }

POST /api/v1/actions
  body: { "site_id","alert_id"?,"title","description","action_category","priority","due_date"? }
  -> 201, created action (status defaults to "planned"). Writes an audit_logs row.

PATCH /api/v1/actions/{action_id}
  body: { "status"?, "priority"?, "due_date"? }
  -> updated action. Writes an audit_logs row on status change.

GET  /api/v1/dashboard/actions-summary
  -> { "by_status": { "planned": n, "in_progress": n, "completed": n, "cancelled": n } }
```

### Audit log (read-only)

```
GET  /api/v1/audit-logs?project_id=&site_id=&limit=
  -> { "items": [ { "id","user_id","user_name","project_id","site_id","action_type",
                     "entity_type","entity_id","summary","metadata","created_at" } ], "total": n }
  scoped to the current user's own projects (via project_id or the project owning site_id);
  entries with a null project_id/site_id (rare) are not returned to any non-owner.
```

### Restoration impact timeline (Feature 2 — no new table; derived from existing data)

```
GET  /api/v1/sites/{site_id}/impact-timeline
  -> {
    "first": { "recorded_at","carbon_captured_tco2e","biodiversity_score",
                "vegetation_cover_percent","species_count" },
    "latest": { same shape },
    "changes": { "carbon_pct","biodiversity_points","vegetation_pct","species_count_delta",
                 "nature_health_score_delta": <latest_assessment.score - an assessment computed
                 as-of the first record, or null if not computable> },
    "summary": "Over the last {N} months, estimated carbon capture increased by {x}%, vegetation
                cover improved by {y}%, and biodiversity score improved by {z} points."
                -- template-filled from `changes`, sign-aware ("increased"/"decreased" or
                "improved"/"declined"), NEVER claim this text was written by an LLM.
  }
```

## Ownership & ordering

Every new endpoint follows the existing pattern in `app/dependencies/auth.py` /
`app/repositories/*` — resolve the current user, join through `projects.owner_id`, 404 on
mismatch. Reuse existing repositories/services where sensible rather than duplicating query
logic (e.g. reuse the existing site/project ownership-lookup helpers).

## Audit log summary phrasing

Use the acting user's `full_name` (not email) in the human-readable `summary`, e.g.:
`"{full_name} created a {priority title-case}-priority {action_category} action for {site.name}."`
`"{full_name} acknowledged a {severity} alert on {site.name}."`
`"{full_name} added a site boundary for {site.name}."` (on site create/update)
`"{full_name} logged {analytics_month} analytics for {site.name}."` (on analytics create, if this
endpoint is exercised — seeding does not need to emit an audit row per record, one summary entry
for the whole seed batch per site is acceptable and much lighter-weight)
