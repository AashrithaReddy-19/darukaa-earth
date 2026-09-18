"""Pytest fixtures for the API test suite.

These tests run against a real PostgreSQL + PostGIS database -- there is no
SQLite/spatialite fallback (geometry + JSON aggregate behavior differs too
much to trust). Point `TEST_DATABASE_URL` at a disposable Postgres+PostGIS
database before running pytest, e.g.:

    export TEST_DATABASE_URL=postgresql+psycopg2://darukaa:darukaa@localhost:5432/darukaa_test
    pytest

If `TEST_DATABASE_URL` is not set, the whole suite is skipped rather than
failing noisily (useful for environments -- such as CI lint-only jobs, or
this sandbox -- that don't have a database available).
"""

import os
import sys
from pathlib import Path

import pytest

sys.path.append(str(Path(__file__).resolve().parents[2]))

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL")

if not TEST_DATABASE_URL:
    collect_ignore_glob = ["test_*.py"]
else:
    os.environ.setdefault("DATABASE_URL", TEST_DATABASE_URL)
    os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-not-for-production")

    from fastapi.testclient import TestClient  # noqa: E402
    from sqlalchemy import create_engine, text  # noqa: E402
    from sqlalchemy.orm import sessionmaker  # noqa: E402

    import app.models  # noqa: E402,F401
    from app.db.base import Base  # noqa: E402
    from app.dependencies.db import get_db  # noqa: E402
    from app.main import app  # noqa: E402

    engine = create_engine(TEST_DATABASE_URL, future=True)
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)

    @pytest.fixture(scope="session", autouse=True)
    def _setup_database():
        with engine.begin() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        yield
        Base.metadata.drop_all(bind=engine)

    @pytest.fixture(autouse=True)
    def _clean_tables():
        with engine.begin() as conn:
            conn.execute(
                text(
                    "TRUNCATE TABLE audit_logs, conservation_actions, field_observations, "
                    "site_alerts, site_risk_assessments, species_observations, "
                    "site_analytics, sites, projects, users RESTART IDENTITY CASCADE"
                )
            )
        yield

    @pytest.fixture()
    def client():
        def _override_get_db():
            db = TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = _override_get_db
        with TestClient(app) as test_client:
            yield test_client
        app.dependency_overrides.clear()

    def register_and_login(
        client,
        email: str = "user@example.com",
        password: str = "Password123",
        full_name: str = "Test User",
    ) -> dict[str, str]:
        client.post(
            "/api/v1/auth/register",
            json={"full_name": full_name, "email": email, "password": password},
        )
        resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
        token = resp.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
