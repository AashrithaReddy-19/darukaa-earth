# Darukaa.Earth Backend

FastAPI + PostgreSQL/PostGIS backend implementing `../docs/API_CONTRACT.md` exactly. See that
file for the binding request/response shapes shared with the frontend.

## Stack

FastAPI, SQLAlchemy 2.x (sync), Alembic, PostgreSQL + PostGIS, GeoAlchemy2, JWT auth
(`python-jose` + `passlib[bcrypt]`), Pydantic v2, pytest, ruff, black, pre-commit.

## 1. Install dependencies

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## 2. Run PostgreSQL + PostGIS locally

Easiest via Docker:

```bash
docker run --name darukaa-postgres -e POSTGRES_USER=darukaa -e POSTGRES_PASSWORD=darukaa \
  -e POSTGRES_DB=darukaa -p 5432:5432 -d postgis/postgis:16-3.4
```

Then create a second database for tests (or reuse the same server with a different name):

```bash
docker exec -it darukaa-postgres psql -U darukaa -c "CREATE DATABASE darukaa_test;"
```

## 3. Configure environment

```bash
cp .env.example .env
# edit .env: set JWT_SECRET_KEY to a real random value, adjust DATABASE_URL / TEST_DATABASE_URL
# if your Postgres isn't on localhost:5432 with the darukaa/darukaa credentials above.
```

## 4. Run migrations

```bash
alembic upgrade head
```

This creates the `postgis` extension and all five tables (`users`, `projects`, `sites`,
`site_analytics`, `species_observations`) with their enum types and indexes.

## 5. Seed demo data

```bash
python -m scripts.seed
```

Creates one admin user (`admin@darukaa.earth` / `Demo@12345`), 3 projects, 7 sites with real
GeoJSON polygons over Indian coordinates, 13 months of analytics per site, and species
observations across all 6 observation categories. The script truncates the core tables first,
so it's meant to run once against a freshly migrated database, not layered on top of real data.

## 6. Run the dev server

```bash
uvicorn app.main:app --reload
```

API docs at `http://localhost:8000/docs`, health check at `http://localhost:8000/health`.

## 7. Run tests

The test suite talks to a real Postgres+PostGIS database (no SQLite/spatialite fallback --
geometry and JSON aggregate behavior differ too much from Postgres to trust it). Point
`TEST_DATABASE_URL` at a disposable database before running pytest:

```bash
export TEST_DATABASE_URL=postgresql+psycopg2://darukaa:darukaa@localhost:5432/darukaa_test
pytest
```

If `TEST_DATABASE_URL` is not set, the DB-backed test suite is skipped rather than failing.
Tests create/drop all tables once per session and truncate them between tests, so they're safe
to run repeatedly against the same test database.

## 8. Lint and format

```bash
ruff check . --fix
black .
```

## 9. Pre-commit hooks

```bash
pre-commit install
```

Runs `black` and `ruff --fix` on every commit. `pytest` is intentionally **not** wired into
pre-commit since it requires a live database -- run it manually or wire it into CI instead.

## Project layout

```
app/
  api/v1/          FastAPI routers (auth, projects, sites, analytics, dashboard)
  core/            settings (env-driven) and JWT/password helpers
  db/              SQLAlchemy engine/session + declarative Base
  models/          SQLAlchemy ORM models + shared enums
  schemas/         Pydantic request/response models mirroring API_CONTRACT.md
  services/        business logic: ownership checks, geometry validation, aggregation
  repositories/    DB query layer, one per resource
  dependencies/    get_db, get_current_user, pagination
  tests/           pytest suite (see above)
  main.py          FastAPI app factory, CORS, router wiring, /health
alembic/           migrations (hand-written initial schema in versions/0001_initial_schema.py)
scripts/seed.py    demo data seed script
```

## Feature extensions (v2) — nature-intelligence module

Five additive features layered on top of the original API, implemented against
[`../docs/FEATURE_CONTRACT_V2.md`](../docs/FEATURE_CONTRACT_V2.md) (the binding contract — see it
for exact request/response shapes, enum values, and every numeric threshold). None of the original
five tables, endpoints, or auth flow changed.

- **Nature Health Score & Alerts** — `site_risk_assessments` + `site_alerts` tables. The score is
  a **deterministic weighted formula, not a trained AI/ML model**: 7 components (ecosystem health
  25%, biodiversity trend 20%, vegetation trend 15%, carbon trend 15%, soil moisture 10%,
  disturbance risk 10%, species-observation trend 5%), each normalized 0–100, summed and rounded.
  Score bands: `>=80` healthy, `>=65` watch, `>=45` at_risk, `<45` critical. Recalculating an
  assessment evaluates 6 alert-trigger rules (score below 70, vegetation/biodiversity/species
  decline over a trailing ~3-month window, high disturbance risk, critically low soil moisture)
  and creates at most one combined alert per run (skipped if an open alert already exists for
  that site within 24h).
  `GET/POST /api/v1/sites/{id}/risk-assessment[/recalculate]`,
  `GET /api/v1/alerts`, `PATCH /api/v1/alerts/{id}`, `GET /api/v1/dashboard/alerts-summary`.
- **Restoration Impact Timeline** — no new table; derived from existing `site_analytics`,
  comparing the first vs latest record and template-filling a plain-English summary sentence
  (explicitly **not** LLM-generated). `GET /api/v1/sites/{id}/impact-timeline`.
- **Field Observations** — `field_observations` table for admin-logged sightings/notes, optional
  lat/lng for map plotting. `GET/POST /api/v1/sites/{id}/field-observations`.
- **Conservation Action Planner** — `conservation_actions` table, optionally linked to the alert
  that prompted it. `GET/POST /api/v1/actions`, `PATCH /api/v1/actions/{id}`,
  `GET /api/v1/dashboard/actions-summary`.
- **Audit Trail** — `audit_logs` table, insert-only (no update/delete route exists anywhere for
  it, enforced by a dedicated test), written on project/site/alert/action changes with a
  human-readable `summary` and no secrets in `metadata`. `GET /api/v1/audit-logs`.

All values produced by these features (scores, alerts, summaries, seeded observations/actions)
are **demo intelligence data** — deterministic and rule-based from the seeded analytics, never
presented as real satellite/sensor/ML output. Migration: `alembic/versions/0002_nature_intelligence.py`.

## Notes on a couple of contract judgment calls

- **`site.latest_snapshot.recorded_at`**: the contract's Site example shows `"iso"` as a
  placeholder, but the underlying `site_analytics.recorded_at` column is a date (matching the
  Analytics endpoint's own `"2025-01-01"` example for the same field name). Both endpoints
  serialize `recorded_at` as `YYYY-MM-DD` for consistency.
- **`dashboard.summary.total_active_sites`**: interpreted as the count of sites whose
  `monitoring_status == "active"` (as opposed to total site count across all projects, which
  is already implied by summing each project's `site_count`).
- **`GET /projects/{id}/sites` vs `GET /sites/{id}`**: only the single-site endpoint embeds the
  `project` summary object per the contract's wording ("Site (includes `project` summary)");
  list responses return `project: null` to keep payloads smaller.
- Optional `skip`/`limit` query params were added to the project/site list endpoints
  (defaulting to 0/200) for pagination headroom; they're additive and don't change the
  documented response shape or break clients that omit them.
