from app.tests.conftest import register_and_login

DEFAULT_PROJECT_PAYLOAD = {
    "name": "Test Project",
    "description": "A test project",
    "country": "India",
    "region": "Test Region",
    "project_type": "forest_conservation",
    "status": "planning",
    "start_date": "2024-01-01",
    "end_date": None,
    "color": "#1b4332",
}


def _create_project(client, headers, **overrides):
    payload = dict(DEFAULT_PROJECT_PAYLOAD, **overrides)
    return client.post("/api/v1/projects", json=payload, headers=headers)


def test_project_crud_lifecycle(client):
    headers = register_and_login(client, email="owner@example.com")

    create_resp = _create_project(client, headers)
    assert create_resp.status_code == 201
    project = create_resp.json()
    assert project["site_count"] == 0
    assert project["total_area_hectares"] == 0
    assert project["total_carbon_tco2e"] == 0
    assert project["avg_biodiversity_score"] is None
    assert project["owner_id"]
    project_id = project["id"]

    list_resp = client.get("/api/v1/projects", headers=headers)
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] == 1

    get_resp = client.get(f"/api/v1/projects/{project_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == project_id

    patch_resp = client.patch(
        f"/api/v1/projects/{project_id}", json={"status": "active"}, headers=headers
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "active"

    delete_resp = client.delete(f"/api/v1/projects/{project_id}", headers=headers)
    assert delete_resp.status_code == 204

    get_after_delete = client.get(f"/api/v1/projects/{project_id}", headers=headers)
    assert get_after_delete.status_code == 404


def test_project_search_and_status_filter(client):
    headers = register_and_login(client, email="search@example.com")
    _create_project(client, headers, name="Mangrove Alpha", status="active")
    _create_project(client, headers, name="Forest Beta", status="planning")

    search_resp = client.get("/api/v1/projects", params={"search": "Mangrove"}, headers=headers)
    assert search_resp.status_code == 200
    assert search_resp.json()["total"] == 1

    status_resp = client.get("/api/v1/projects", params={"status": "planning"}, headers=headers)
    assert status_resp.status_code == 200
    assert status_resp.json()["total"] == 1


def test_create_project_requires_auth(client):
    resp = client.post("/api/v1/projects", json=DEFAULT_PROJECT_PAYLOAD)
    assert resp.status_code == 401
