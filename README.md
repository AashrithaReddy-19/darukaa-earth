# Darukaa.Earth — Nature Intelligence Dashboard

A carbon and biodiversity project-management dashboard for environmental teams: register
conservation projects, draw and manage geographic monitoring sites on an interactive map, and
track carbon sequestration and biodiversity trends over time.

> Built for a Full-Stack Developer Hackathon. All monitoring data (carbon, biodiversity,
> species observations) is **seeded demonstration data**, clearly labelled as such in the UI —
> it is not real field data from an actual Darukaa.Earth project.

**Repository:** https://github.com/AashrithaReddy-19/darukaa-earth (private — see reviewer
access notes in the submission document)
**Live frontend:** https://darukaa-earth-blush.vercel.app
**Live backend API / Swagger docs:** https://darukaa-backend-fg3e.onrender.com/docs
**Demo login:** `admin@darukaa.earth` / `Demo@12345`

> Both services run on free tiers (Render free web services and free Postgres spin down after
> inactivity and can take ~30-60s to wake on the first request; the free Postgres also expires
> 30 days after creation). This is fine for a hackathon demo but not a production SLA — see
> [section 16](#16-trade-offs--future-improvements).

---

## Table of contents

1. [Project overview](#1-project-overview)
2. [Features](#2-features)
3. [Architecture](#3-architecture)
4. [Tech stack](#4-tech-stack)
5. [Database schema](#5-database-schema)
6. [ER diagram](#6-er-diagram)
7. [API overview](#7-api-overview)
8. [Local setup without Docker](#8-local-setup-without-docker)
9. [Local setup with Docker Compose](#9-local-setup-with-docker-compose)
10. [Environment variables](#10-environment-variables)
11. [Seeding demo data](#11-seeding-demo-data)
12. [Code quality & pre-commit hooks](#12-code-quality--pre-commit-hooks)
13. [Testing](#13-testing)
14. [CI/CD](#14-cicd)
15. [Deployment](#15-deployment)
16. [Trade-offs & future improvements](#16-trade-offs--future-improvements)
17. [Demo credentials](#17-demo-credentials)
18. [Screenshots](#18-screenshots)
19. [Security notes](#19-security-notes)

---

## 1. Project overview

Darukaa.Earth lets an authenticated administrator:

- Register and log in securely (JWT access + refresh tokens).
- Create and manage conservation **projects** (e.g. mangrove restoration, forest conservation).
- Add multiple **sites** under each project, drawing each site's boundary as a polygon directly
  on a Mapbox map.
- View every project and site on an interactive overview map, colour-coded by status.
- Drill into a site's analytics: carbon captured, biodiversity score, species observations,
  vegetation cover, soil moisture and ecosystem health, all as monthly trends with charts and
  a date-range filter.

The goal is a dashboard that feels like a real environmental-intelligence product — accurate
geospatial storage (PostGIS), a real auth flow, ownership-scoped data access, and clean,
production-shaped code on both ends — rather than a static mockup.

## 2. Features

- Email/password auth with bcrypt hashing and short-lived access tokens + rotating refresh tokens.
- Full CRUD for projects and sites, scoped per-owner (users only ever see their own data).
- Polygon drawing/editing via Mapbox GL Draw, stored as PostGIS `GEOMETRY` (SRID 4326) and
  converted back to GeoJSON for the frontend.
- Server-side area calculation in hectares using PostGIS (`ST_Area` over geography), never
  trusting a client-supplied area.
- Dashboard summary cards (projects, sites, area, carbon, biodiversity, species) and an overview
  map of every site.
- Site analytics with date-range filtering (3/6/12 months or all-time) and five chart types
  (carbon over time, biodiversity over time, species by category, ecosystem health breakdown,
  vegetation cover over time).
- Realistic seed data across three demo projects inspired by Indian ecosystems (Sundarbans
  mangroves, Western Ghats forest corridor, Deccan agroforestry).
- Dockerised local dev stack (Postgres+PostGIS, FastAPI, React) that runs with one command.
- CI on every PR (lint, type-check, build, backend tests against a real PostGIS service
  container) and a documented deployment path to Vercel + Render.

## 3. Architecture

```mermaid
flowchart LR
    subgraph Client["Browser"]
        FE["React + TypeScript SPA\n(Vite, Tailwind, Mapbox GL, Chart.js)"]
    end

    subgraph Server["Backend"]
        API["FastAPI application\n/api/v1 REST routes"]
        SVC["Service layer\n(auth, project, site, analytics, dashboard)"]
        REPO["Repository layer\n(SQLAlchemy queries)"]
    end

    subgraph Data["Data store"]
        PG[("PostgreSQL + PostGIS")]
    end

    subgraph External["External services"]
        MB["Mapbox tiles & Draw API"]
    end

    FE -- "HTTPS / JSON\nBearer JWT" --> API
    API --> SVC --> REPO --> PG
    FE -- "vector tiles / geocoding" --> MB

    subgraph Deploy["Deployment"]
        VC["Vercel\n(static frontend hosting)"]
        RD["Render\n(FastAPI web service)"]
        RDB["Render PostgreSQL\n(PostGIS enabled)"]
    end

    FE -.deployed as.-> VC
    API -.deployed as.-> RD
    PG -.hosted as.-> RDB
```

**Why this shape:** the frontend never talks to the database directly — all geometry
validation, area computation, and ownership checks happen server-side so the client cannot
forge area values or reach another user's data. The backend is layered (routes → services →
repositories) so business logic (e.g. "recompute area on boundary update") lives in one place
and is unit-testable independently of HTTP or SQL concerns.

## 4. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | React + TypeScript + Vite | Fast dev server, first-class TS support, huge ecosystem for a hackathon timeline. |
| Styling | Tailwind CSS | Rapid, consistent design-system-in-utility-classes without hand-rolled CSS sprawl. |
| Maps | Mapbox GL JS + Mapbox GL Draw | The most mature browser vector-map stack with a purpose-built polygon-drawing plugin, avoiding a hand-built drawing tool. |
| Charts | Chart.js + react-chartjs-2 | Lightweight, accessible, well-documented — enough chart types (line/bar/doughnut) without a heavier viz library. |
| Forms | React Hook Form + Zod | Uncontrolled-input performance plus a single schema shared for both types and validation messages. |
| Backend framework | FastAPI | Async-ready, automatic OpenAPI/Swagger docs, native Pydantic validation, minimal boilerplate for a REST API. |
| ORM | SQLAlchemy 2.x + GeoAlchemy2 | GeoAlchemy2 is the standard bridge for spatial columns/queries on top of SQLAlchemy. |
| Database | PostgreSQL + PostGIS | Only mainstream open-source database with production-grade geometry types, spatial indexing, and accurate area/`ST_Area` calculations over real-world coordinates. |
| Migrations | Alembic | Standard, version-controlled schema migrations paired with SQLAlchemy. |
| Auth | JWT (access + refresh) | Stateless, works cleanly with a decoupled SPA + API deployed to two different hosts (Vercel/Render), no shared-session infrastructure needed. |
| Demo data | Seeded, clearly labelled | Real satellite-derived carbon/biodiversity monitoring requires data pipelines and licensing outside a hackathon's scope; seeded data lets every reviewer see fully-populated analytics immediately, and is labelled "Demo monitoring data" in the UI so it's never mistaken for a live feed. |

## 5. Database schema

Five tables, all owned (directly or transitively) by a `users` row, enforcing per-user data
isolation at the query layer:

- **users** — account records (`id`, `full_name`, `email` unique, `hashed_password`, `is_active`, timestamps).
- **projects** — a conservation initiative belonging to a user (`owner_id` FK), with type/status
  enums, country/region, dates.
- **sites** — a monitored geographic area under a project (`project_id` FK), storing the polygon
  boundary as a PostGIS `GEOMETRY(SRID 4326)` column plus a server-computed `area_hectares`.
- **site_analytics** — one row per monitoring snapshot for a site (`site_id` FK): carbon,
  biodiversity, species count, vegetation cover, soil moisture, ecosystem health, disturbance risk.
- **species_observations** — individual/aggregated species sightings per site, categorised
  (Bird/Mammal/Reptile/Amphibian/Plant/Insect).

All child tables cascade-delete with their parent (deleting a project removes its sites,
analytics, and observations). See [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) for the exact
field-level shapes returned by the API, and `backend/app/models/` for the SQLAlchemy definitions.

## 6. ER diagram

```mermaid
erDiagram
    USERS ||--o{ PROJECTS : owns
    PROJECTS ||--o{ SITES : contains
    SITES ||--o{ SITE_ANALYTICS : has
    SITES ||--o{ SPECIES_OBSERVATIONS : has

    USERS {
        uuid id PK
        string full_name
        string email UK
        string hashed_password
        bool is_active
        timestamp created_at
        timestamp updated_at
    }

    PROJECTS {
        uuid id PK
        uuid owner_id FK
        string name
        text description
        string country
        string region
        enum project_type
        enum status
        date start_date
        date end_date
        string color
        timestamp created_at
        timestamp updated_at
    }

    SITES {
        uuid id PK
        uuid project_id FK
        string name
        string site_code UK
        enum ecosystem_type
        enum monitoring_status
        text notes
        geometry boundary "SRID 4326"
        float area_hectares
        timestamp created_at
        timestamp updated_at
    }

    SITE_ANALYTICS {
        uuid id PK
        uuid site_id FK
        date recorded_at
        float carbon_captured_tco2e
        float biodiversity_score
        int species_count
        float vegetation_cover_percent
        float soil_moisture_percent
        float ecosystem_health_score
        enum disturbance_risk
        timestamp created_at
    }

    SPECIES_OBSERVATIONS {
        uuid id PK
        uuid site_id FK
        string species_name
        string scientific_name
        enum category
        int observation_count
        timestamp observed_at
        float confidence_score
    }
```

## 7. API overview

All endpoints are versioned under `/api/v1` (plus an unprefixed `GET /health`). Full request/
response shapes are defined in [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md), which is the
binding contract both the frontend and backend implement against. Interactive Swagger docs are
served by FastAPI at `/docs` (and ReDoc at `/redoc`) once the backend is running.

| Resource | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me` |
| Projects | `GET/POST /projects`, `GET/PATCH/DELETE /projects/{id}` |
| Sites | `GET/POST /projects/{id}/sites`, `GET/PATCH/DELETE /sites/{id}` |
| Analytics | `GET/POST /sites/{id}/analytics`, `GET /sites/{id}/species-observations` |
| Dashboard | `GET /dashboard/summary`, `GET /dashboard/map-sites` |
| Health | `GET /health` |

Every project/site/analytics/observation request is scoped to the authenticated user; accessing
another user's resource returns `404` (not `403`, to avoid leaking existence of other users' data).

## 8. Local setup without Docker

Requirements: Node.js 20+, Python 3.11+, a local PostgreSQL 14+ with the PostGIS extension
available (e.g. via [postgresapp.com](https://postgresapp.com), `apt install postgresql-16-postgis-3`,
or `brew install postgis`).

```bash
# 1. Database
createdb darukaa_earth
psql darukaa_earth -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# 2. Backend
cd backend
cp .env.example .env        # edit DATABASE_URL / JWT_SECRET_KEY as needed
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
python -m scripts.seed      # optional but recommended — see section 11
uvicorn app.main:app --reload   # http://localhost:8000, docs at /docs

# 3. Frontend (in a second terminal)
cd frontend
cp .env.example .env        # set VITE_MAPBOX_TOKEN, VITE_API_BASE_URL
npm install
npm run dev                 # http://localhost:5173
```

## 9. Local setup with Docker Compose

Requirements: Docker + Docker Compose.

```bash
cp .env.example .env        # set VITE_MAPBOX_TOKEN and JWT_SECRET_KEY at minimum
docker compose up --build
```

This starts three services:

- `db` — `postgis/postgis:16-3.4`, persisted to the named volume `darukaa_postgres_data`.
- `backend` — runs `alembic upgrade head` then `uvicorn`, exposed on `http://localhost:8000`.
- `frontend` — production build served on `http://localhost:5173`.

Seed demo data into the containerised database with:

```bash
docker compose exec backend python -m scripts.seed
```

Stop everything with `docker compose down` (add `-v` to also drop the Postgres volume).

You can still run either service standalone during development — e.g. `docker compose up db`
to get just the database, then run the backend/frontend natively as in section 8.

## 10. Environment variables

| Variable | Used by | Description |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Docker Compose `db` | Local PostGIS container credentials. |
| `DATABASE_URL` | Backend | SQLAlchemy connection string, e.g. `postgresql+psycopg2://user:pass@host:5432/db`. |
| `JWT_SECRET_KEY` | Backend | Secret used to sign access/refresh tokens. Must be a long random value in any non-local environment. |
| `JWT_ALGORITHM` | Backend | JWT signing algorithm (default `HS256`). |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Backend | Access token lifetime (default `15`). |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Backend | Refresh token lifetime (default `7`). |
| `FRONTEND_ORIGIN` | Backend | Allowed CORS origin — the deployed/local frontend URL. |
| `ENVIRONMENT` | Backend | `development` / `test` / `production` flag for conditional behaviour. |
| `VITE_API_BASE_URL` | Frontend | Base URL of the backend **server root** (no `/api/v1` suffix — the frontend appends `/api/v1/...` to this itself). |
| `VITE_MAPBOX_TOKEN` | Frontend | Mapbox GL JS public access token. |
| `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` | CI (`deploy.yml`) | Vercel deployment credentials, stored as GitHub secrets. |
| `RENDER_DEPLOY_HOOK_URL` | CI (`deploy.yml`) | Render deploy hook to trigger a backend redeploy. |

See the root [`.env.example`](.env.example), [`backend/.env.example`](backend/.env.example), and
[`frontend/.env.example`](frontend/.env.example) for copy-pasteable templates. **No real secret
is ever committed** — every `.env.example` file contains placeholders only.

## 11. Seeding demo data

```bash
# native
cd backend && python -m scripts.seed

# Docker Compose
docker compose exec backend python -m scripts.seed
```

This creates:

- Demo admin user — see [section 17](#17-demo-credentials).
- Three projects: **Sundarbans Mangrove Restoration**, **Western Ghats Biodiversity Corridor**,
  **Deccan Agroforestry Initiative**.
- Six-plus sites with real-shaped polygons positioned around the corresponding Indian regions.
- 12+ months of monthly analytics per site, and species observations across all six categories.

The script is intended to run once against a fresh database (it is safe to re-run against an
empty DB, but re-running against a populated one may create duplicate rows — drop and recreate
the database, or truncate the tables, if you want a clean reseed).

**These are demonstration datasets inspired by the general character of Indian mangrove, Western
Ghats, and Deccan-plateau ecosystems — they are not real field measurements from an actual
Darukaa.Earth project**, and the UI labels site analytics as "Demo monitoring data" accordingly.

## 12. Code quality & pre-commit hooks

**Frontend** — ESLint + Prettier, enforced on commit via Husky + lint-staged:

```bash
cd frontend
npm install        # also installs the Husky git hook via the "prepare" script
npm run lint
npm run format
```

**Backend** — Ruff + Black, enforced on commit via `pre-commit`:

```bash
cd backend
pip install -r requirements.txt
pre-commit install
ruff check .
black --check .
```

Once hooks are installed, every `git commit` automatically formats/lints staged files and blocks
the commit on unfixable errors.

## 13. Testing

```bash
# Backend (requires a reachable Postgres+PostGIS — set TEST_DATABASE_URL, see backend/README.md)
cd backend && pytest -v

# Frontend
cd frontend && npm run test
```

Backend tests cover auth (register/login/duplicate email), unauthorized-access rejection,
project CRUD, cross-user ownership protection, valid/invalid polygon submission, dashboard
aggregation, and analytics range filtering. Frontend tests cover protected-route redirection,
login/project/site form validation, and the "must draw a boundary" polygon guard. See
`backend/README.md` and `frontend/README.md` for full details.

## 14. CI/CD

[`\.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push/PR to `main`:

- **Frontend job:** `npm ci` → lint → typecheck → unit tests → production build.
- **Backend job:** installs dependencies against a **PostGIS service container**, runs Ruff,
  Black (`--check`), Alembic migrations, then the pytest suite.

[`\.github/workflows/deploy.yml`](.github/workflows/deploy.yml) is an optional scripted
deployment pipeline (see [section 15](#15-deployment), Option 2) triggered on push to `main` or
manually via `workflow_dispatch`, deploying the frontend to Vercel and triggering a Render
backend redeploy — entirely via GitHub Actions secrets, no hard-coded credentials.

## 15. Deployment

**This repository is already deployed** — see the live URLs at the top of this README. It was
deployed with the Render and Vercel CLIs directly (`render` and `vercel`) rather than through
their dashboard GitHub integrations, because connecting a private repo to either platform's
GitHub App requires a one-time authorization click in a browser that wasn't available in the
automated session that built this. The backend runs from a Docker image published to GitHub
Container Registry (`ghcr.io/aashrithareddy-19/darukaa-backend`) rather than a Render Blueprint
build, for the same reason. Two platform quirks worth knowing if you redeploy:
- Render's free web-service plan does not support pre-deploy commands, one-off jobs, or SSH — so
  `alembic upgrade head` runs as part of the container's own startup command instead (see
  `backend/Dockerfile`'s `CMD`), which works on any plan.
- Vercel's SSO Deployment Protection is on by default for new projects created via the CLI; it
  was disabled for this project (`vercel project protection disable <project> --sso`) so the live
  URL is publicly reachable without a Vercel login.
- On this Vercel account, only a project's *first* `vercel deploy` reliably completed — every
  subsequent deploy on the same project hung indefinitely in a "Building…" state (confirmed via
  direct polling of the deployment URL, independent of the CLI, for 6+ minutes with no progress),
  most likely an account-level throttle after a burst of CLI activity. The reliable workaround
  used here: recreate the Vercel project and deploy exactly once with the final, correct env vars
  already set, then use `vercel alias set <deployment> <stable-alias>.vercel.app` to point a fixed
  hostname at that deployment — the alias survives independently of which project or deployment
  it was last assigned to, so it can be repointed without another deploy. Also watch for
  concurrent `vercel deploy` invocations (e.g. a stray background process) — the Hobby plan allows
  only one build at a time, and a second overlapping deploy will also hang.

Two supported paths for your own deployment — pick whichever fits your workflow:

### Option 1 — native Git integrations (simplest)

1. Push this repository to GitHub.
2. **Frontend → Vercel:** import the repo in the Vercel dashboard, set the project root to
   `frontend/`, framework preset "Vite", and add `VITE_API_BASE_URL` + `VITE_MAPBOX_TOKEN` as
   Vercel environment variables. Every push to `main` auto-deploys.
3. **Database → Render:** create a Blueprint from [`render.yaml`](render.yaml) (New → Blueprint →
   select this repo) — this provisions both the `darukaa-db` Postgres instance and the
   `darukaa-backend` web service. After the database is created, enable PostGIS once via the
   Render psql console: `CREATE EXTENSION IF NOT EXISTS postgis;`.
4. **Backend → Render:** the same Blueprint deploy builds `backend/Dockerfile`, runs
   `alembic upgrade head` as a pre-deploy step, and exposes `/health` as its health check. Set
   `JWT_SECRET_KEY` and `FRONTEND_ORIGIN` (your Vercel URL) in the Render dashboard — they're
   marked `sync: false` in the Blueprint so Render prompts for them rather than storing a default.
5. Copy the resulting Render backend URL into Vercel's `VITE_API_BASE_URL`
   (`https://<service>.onrender.com` — no `/api/v1` suffix, the frontend appends that itself)
   and redeploy the frontend.

### Option 2 — GitHub Actions deployment

Add these repository secrets, then push to `main` (or run the workflow manually):

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
RENDER_DEPLOY_HOOK_URL
VITE_API_BASE_URL
VITE_MAPBOX_TOKEN
DATABASE_URL       (only if you manage the DB outside the Render Blueprint)
JWT_SECRET_KEY      (only if you manage backend env vars outside the Render dashboard)
```

`deploy.yml` then builds and deploys the frontend via the Vercel CLI and triggers a Render
redeploy via its deploy hook. This keeps deploys gated behind a workflow you control (e.g. only
after CI passes) instead of Vercel/Render's own auto-deploy-on-push.

## 16. Trade-offs & future improvements

- **Demo data instead of live monitoring feeds** — see the tech-stack table; real satellite/
  IoT-derived carbon and biodiversity pipelines are out of scope for a hackathon timeline.
- **JWT in memory + localStorage persistence** rather than httpOnly cookies — simpler to reason
  about across two separately-hosted origins (Vercel + Render) without shared-cookie/CSRF setup;
  a production hardening pass would move to httpOnly, SameSite cookies with a CSRF token.
- **Render/Vercel free tiers** — the documented deployment targets cold-start on the free plan;
  fine for a demo, not for production SLAs.
- **Single-owner data model** — every project has exactly one owner and no team/role sharing;
  a real product would need organizations and role-based access control.
- **Future improvements:** map clustering for large site counts, CSV/GeoJSON export of a site's
  analytics, background jobs for real data ingestion, pagination on list endpoints beyond the
  current single-page responses, and E2E tests (Playwright/Cypress) covering the full
  draw-a-polygon-and-save flow in a real browser.

## 17. Demo credentials

```
Email:    admin@darukaa.earth
Password: Demo@12345
```

This account already exists and is seeded on the live deployment linked at the top of this
README — log in there directly with no setup required. For your own deployment or local run,
seed this account via `python -m scripts.seed` (see [section 11](#11-seeding-demo-data)) before
logging in — the account does not exist until the seed script has been run against your database.

## 18. Screenshots

> Add screenshots after running the app locally: `docker compose up --build`, log in with the
> demo credentials above, then capture each view below and save it into `docs/screenshots/`
> with the filename indicated, replacing the placeholder line under each heading.

### Dashboard
`docs/screenshots/dashboard.png`

### Projects list
`docs/screenshots/projects.png`

### Project detail with map
`docs/screenshots/project-detail.png`

### Draw a site boundary
`docs/screenshots/site-draw.png`

### Site analytics & charts
`docs/screenshots/site-analytics.png`

## 19. Security notes

- Passwords are hashed with bcrypt (via `passlib`) — never stored or logged in plaintext.
- JWT access tokens are short-lived (15 min default); refresh tokens rotate on use and are
  longer-lived (7 days default). Both are signed with `JWT_SECRET_KEY`, which must be a long
  random value in any deployed environment and is never committed to source control.
- All project/site/analytics/observation access is scoped server-side to the authenticated
  user's own resources; cross-user access attempts return `404`, not `403`, to avoid confirming
  the existence of other users' data.
- Client-supplied geometry is validated (valid, non-self-intersecting Polygon/MultiPolygon) and
  re-projected server-side before storage; area is always computed server-side via PostGIS,
  never trusted from the client.
- CORS is restricted to the configured `FRONTEND_ORIGIN` — not left wide open.
- No secrets, tokens, or `.env` files are committed; every environment file in this repo is a
  `.env.example` template with placeholder values only.
- Dependency and static-analysis checks (Ruff, ESLint, Black) run in CI on every PR.

---

## Suggested commit history (for reference)

If developing this project incrementally, a clean commit sequence looks like:

```
chore: scaffold monorepo structure and API contract
feat(backend): add user model, JWT auth, and register/login/refresh endpoints
feat(backend): add project CRUD with ownership scoping
feat(backend): add site model with PostGIS boundary storage and area calculation
feat(backend): add site analytics and species observation endpoints
feat(backend): add dashboard summary and map-sites endpoints
test(backend): add auth, ownership, and geometry validation tests
feat(frontend): scaffold Vite app, routing, and auth context
feat(frontend): add login/register pages with validation
feat(frontend): add dashboard page with overview map and summary cards
feat(frontend): add projects list, create/edit forms
feat(frontend): add site polygon drawing with Mapbox GL Draw
feat(frontend): add site analytics page with charts and range filter
test(frontend): add protected route and form validation tests
chore: add Docker Compose, Dockerfiles, and CI/CD workflows
docs: write README, API contract, and ER/architecture diagrams
chore: add seed data script and demo dataset
```

---

Built for a Full-Stack Developer Hackathon submission.
