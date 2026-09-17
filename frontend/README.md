# Darukaa.Earth — Nature Intelligence Dashboard (Frontend)

A carbon and biodiversity project-management dashboard for authenticated administrators, built
with React + TypeScript + Vite, Tailwind CSS, React Router v6, Mapbox GL JS, Chart.js and
React Hook Form + Zod. This package implements the frontend only; it talks to a separate FastAPI
backend over the contract described in `../docs/API_CONTRACT.md`.

## Stack

- React 18 + TypeScript, built with Vite
- Tailwind CSS for styling
- React Router v6 for routing
- Mapbox GL JS + `@mapbox/mapbox-gl-draw` for polygon drawing/editing
- Chart.js via `react-chartjs-2` for analytics charts
- Axios for HTTP, with an interceptor-based auth/refresh flow
- React Hook Form + Zod for forms and validation
- Lucide React for icons
- ESLint (flat config) + Prettier, Husky + lint-staged
- Vitest + React Testing Library for tests

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in the values:

```bash
cp .env.example .env
```

| Variable            | Description                                                                                                                                                                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | Root URL of the backend (no trailing `/api/v1` — the app appends that itself). Defaults to `http://localhost:8000` if unset.                                                                                                                               |
| `VITE_MAPBOX_TOKEN` | A Mapbox **public** access token (starts with `pk.`). Create a free account at [account.mapbox.com](https://account.mapbox.com/), then copy a token from your account's Tokens page. Never commit a real token — this repo only ships a blank placeholder. |

If `VITE_MAPBOX_TOKEN` is missing, every map component renders a clear inline
"Mapbox token not configured" message instead of crashing or showing a blank map.

### 3. Run the dev server

```bash
npm run dev
```

The app expects the backend from the sibling `backend/` package to be running at
`VITE_API_BASE_URL` (default `http://localhost:8000`), exposing routes under `/api/v1`.

### 4. Other scripts

| Command                | What it does                                                      |
| ---------------------- | ----------------------------------------------------------------- |
| `npm run build`        | Type-checks (`tsc -b`) and builds a production bundle to `dist/`. |
| `npm run preview`      | Serves the production build locally.                              |
| `npm run lint`         | Runs ESLint across the project (zero warnings allowed).           |
| `npm run lint:fix`     | Same, with `--fix`.                                               |
| `npm run format`       | Formats the codebase with Prettier.                               |
| `npm run format:check` | Checks formatting without writing.                                |
| `npm run typecheck`    | `tsc -b --noEmit` — type-checking only, no build output.          |
| `npm run test`         | Runs the Vitest suite once (jsdom environment).                   |
| `npm run test:watch`   | Runs Vitest in watch mode.                                        |

## Project structure

```
src/
  api/          axios instance + interceptors, one module per resource (auth, projects, sites, analytics, dashboard)
  components/   shared/reusable UI: Button, Input, Select, Card, Badge, Modal, EmptyState, Toast system, ProtectedRoute...
  context/      AuthContext (session state, login/register/logout)
  features/     feature-scoped logic + components (auth, projects, sites, analytics, dashboard, map)
  hooks/        useAuth, useDebounce, useMediaQuery, useAsync
  layouts/      AppLayout (sidebar + topbar), AuthLayout (centered card)
  pages/        route-level pages
  types/        TypeScript types mirroring docs/API_CONTRACT.md exactly, enums as string literal unions
  utils/        formatters, enum label/color maps, error-message helpers
  test/         Vitest setup (jest-dom matchers, mapbox-gl / mapbox-gl-draw mocks)
```

## Authentication & token-refresh flow

- On login/register, the backend returns `{ access_token, refresh_token, token_type, expires_in }`.
  Both tokens are persisted to `localStorage` (via `src/api/tokenStore.ts`) so a session survives
  a page reload, and are also held in the running `AuthContext` state.
- Every outgoing request gets `Authorization: Bearer <access_token>` attached by an axios request
  interceptor (`src/api/client.ts`).
- On app boot, if a token is present in storage, `GET /api/v1/auth/me` is called once to hydrate
  the current user; `ProtectedRoute` shows a loading state until this resolves, then redirects to
  `/login` if it fails or no session exists.
- If any request comes back `401`, a response interceptor automatically calls
  `POST /api/v1/auth/refresh` with the stored refresh token **once**, updates the stored tokens on
  success, and retries the original request. Concurrent 401s are coalesced onto a single in-flight
  refresh call. If the refresh call itself fails, stored tokens are cleared and the app's auth
  state is reset, which causes `ProtectedRoute` to redirect to `/login`.
- Logging out simply clears the stored tokens and resets `AuthContext` state.

## Testing

Tests live next to the code they cover (`*.test.tsx`). `src/test/setup.ts` mocks `mapbox-gl` and
`@mapbox/mapbox-gl-draw` globally (jsdom has no WebGL context), so components that render maps can
be unit-tested without a browser. Coverage includes:

- `ProtectedRoute` — redirect-when-unauthenticated, render-children-when-authenticated, loading state
- `LoginForm` — Zod validation (invalid email, short password) and successful submit
- `ProjectForm` — required-field validation and the end-date-before-start-date rule
- `SiteForm` — the "please draw a boundary" validation message and the valid-boundary path

## Notable implementation choices / deviations

- **Tailwind v3** (not v4) was used so the project matches the classic `tailwind.config.js` +
  `postcss.config.js` file layout requested in the spec.
- **Vitest config lives inside `vite.config.ts`** (`test: {...}`) rather than a separate
  `vitest.config.ts`, as explicitly allowed by the brief.
- **The ecosystem-health doughnut chart** on the Site Analytics page is a presentational
  composition of `vegetation_cover_percent`, `soil_moisture_percent`, and `biodiversity_score`
  from the latest analytics record (documented in `src/features/analytics/EcosystemHealthDoughnut.tsx`) —
  the API does not return a pre-split health breakdown, so this is an illustrative, not scientific, split.
- **Registration auto-logs in**: since `POST /api/v1/auth/register` only returns the created user
  (no tokens per the contract), the frontend follows a successful registration with an automatic
  `login()` call using the same credentials, so new users land straight on the dashboard instead
  of being sent back to the login form.
- **Husky hooks path**: this `frontend/` directory lives inside a larger monorepo whose `.git` is
  one level up, so plain `husky`'s automatic hooks-path detection (which only checks the current
  working directory) can't wire itself up via `npm install` alone. The `prepare` script instead
  runs a small inline Node snippet that `cd`s to the repo root and sets
  `git config core.hooksPath frontend/.husky` directly, so it self-configures correctly on every
  `npm install` regardless of which directory you run it from — no manual step required. The hook
  script itself lives at `frontend/.husky/pre-commit` and `cd`s into `frontend` before running
  `npx lint-staged`.
