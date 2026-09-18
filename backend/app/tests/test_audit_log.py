import re

from app.tests.conftest import register_and_login

PROJECT_PAYLOAD = {
    "name": "Audit Project",
    "description": "desc",
    "country": "India",
    "region": "Region",
    "project_type": "forest_conservation",
    "status": "active",
    "start_date": "2024-01-01",
    "end_date": None,
    "color": "#1b4332",
}

SITE_PAYLOAD = {
    "name": "Audit Site",
    "site_code": "AUD-001",
    "ecosystem_type": "forest",
    "monitoring_status": "active",
    "boundary": {
        "type": "Polygon",
        "coordinates": [[[88.9, 21.6], [88.95, 21.6], [88.95, 21.65], [88.9, 21.65], [88.9, 21.6]]],
    },
    "notes": None,
}

# Patterns that must never appear in an audit log's summary/metadata: JWTs,
# bcrypt hashes, and anything that looks like a DB connection string.
_JWT_PATTERN = re.compile(r"^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$")
_BCRYPT_PATTERN = re.compile(r"^\$2[aby]?\$")
_DB_URL_PATTERN = re.compile(r"(postgres(ql)?|mysql)(\+\w+)?://")


def test_no_update_or_delete_route_for_audit_logs():
    """Audit logs are insert-only from the service layer -- there must be no
    PATCH/PUT/DELETE route registered anywhere under /audit-logs, at any path
    depth (e.g. no /audit-logs/{id} either).
    """
    from app.main import app

    mutating_methods = {"PATCH", "PUT", "DELETE"}
    offending_routes = []
    for route in app.routes:
        path = getattr(route, "path", "")
        methods = getattr(route, "methods", None) or set()
        if "audit-logs" in path and methods & mutating_methods:
            offending_routes.append((path, methods))

    assert offending_routes == []

    # And the only route under /audit-logs is the GET list endpoint.
    audit_routes = [
        (getattr(r, "path", ""), getattr(r, "methods", None))
        for r in app.routes
        if "audit-logs" in getattr(r, "path", "")
    ]
    assert len(audit_routes) == 1
    path, methods = audit_routes[0]
    assert path == "/api/v1/audit-logs"
    assert methods == {"GET"}


def test_audit_log_created_by_project_and_site_actions_and_never_leaks_secrets(client):
    headers = register_and_login(client, email="audit1@example.com")
    project_resp = client.post("/api/v1/projects", json=PROJECT_PAYLOAD, headers=headers)
    project_id = project_resp.json()["id"]

    site_resp = client.post(
        f"/api/v1/projects/{project_id}/sites", json=SITE_PAYLOAD, headers=headers
    )
    site_id = site_resp.json()["id"]

    client.patch(
        f"/api/v1/projects/{project_id}",
        json={"description": "Updated description"},
        headers=headers,
    )
    client.patch(f"/api/v1/sites/{site_id}", json={"notes": "Updated notes"}, headers=headers)

    resp = client.get("/api/v1/audit-logs", params={"project_id": project_id}, headers=headers)
    assert resp.status_code == 200
    body = resp.json()

    entity_action_pairs = {(item["entity_type"], item["action_type"]) for item in body["items"]}
    assert ("project", "created") in entity_action_pairs
    assert ("project", "updated") in entity_action_pairs
    assert ("site", "created") in entity_action_pairs
    assert ("site", "updated") in entity_action_pairs

    for item in body["items"]:
        assert item["user_name"] == "Test User"
        blob = f"{item['summary']} {item.get('metadata')}"
        assert "password" not in blob.lower()
        assert "bearer" not in blob.lower()
        assert not _JWT_PATTERN.search(blob.replace(" ", ""))
        assert not _BCRYPT_PATTERN.search(blob)
        assert not _DB_URL_PATTERN.search(blob)
        assert "mapbox" not in blob.lower()


def test_audit_log_scoped_to_owner(client):
    headers_a = register_and_login(client, email="audit_owner_a@example.com")
    project_id = client.post("/api/v1/projects", json=PROJECT_PAYLOAD, headers=headers_a).json()[
        "id"
    ]

    headers_b = register_and_login(client, email="audit_owner_b@example.com")
    resp = client.get("/api/v1/audit-logs", params={"project_id": project_id}, headers=headers_b)
    assert resp.status_code == 200
    assert resp.json()["items"] == []
    assert resp.json()["total"] == 0

    own_resp = client.get("/api/v1/audit-logs", headers=headers_b)
    assert own_resp.status_code == 200
    assert own_resp.json()["total"] == 0


def test_audit_log_requires_auth(client):
    resp = client.get("/api/v1/audit-logs")
    assert resp.status_code == 401
