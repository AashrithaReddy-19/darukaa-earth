from app.tests.conftest import register_and_login

PROJECT_PAYLOAD = {
    "name": "Site Test Project",
    "description": "desc",
    "country": "India",
    "region": "West Bengal",
    "project_type": "mangrove_restoration",
    "status": "active",
    "start_date": "2024-01-01",
    "end_date": None,
    "color": "#1b4332",
}

VALID_POLYGON = {
    "type": "Polygon",
    "coordinates": [[[88.9, 21.6], [88.95, 21.6], [88.95, 21.65], [88.9, 21.65], [88.9, 21.6]]],
}

# A self-intersecting "bowtie" ring -- invalid per shapely's is_valid check.
INVALID_POLYGON = {
    "type": "Polygon",
    "coordinates": [[[88.9, 21.6], [88.95, 21.65], [88.95, 21.6], [88.9, 21.65], [88.9, 21.6]]],
}


def _create_project(client, headers):
    resp = client.post("/api/v1/projects", json=PROJECT_PAYLOAD, headers=headers)
    return resp.json()["id"]


def test_create_site_valid_polygon(client):
    headers = register_and_login(client, email="sites@example.com")
    project_id = _create_project(client, headers)

    payload = {
        "name": "Test Site",
        "site_code": "TST-001",
        "ecosystem_type": "mangrove",
        "monitoring_status": "active",
        "boundary": VALID_POLYGON,
        "notes": None,
    }
    resp = client.post(f"/api/v1/projects/{project_id}/sites", json=payload, headers=headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["area_hectares"] > 0
    assert body["boundary"]["type"] == "Polygon"
    assert body["project_id"] == project_id

    list_resp = client.get(f"/api/v1/projects/{project_id}/sites", headers=headers)
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] == 1

    get_resp = client.get(f"/api/v1/sites/{body['id']}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["project"]["id"] == project_id


def test_create_site_invalid_polygon(client):
    headers = register_and_login(client, email="sites2@example.com")
    project_id = _create_project(client, headers)

    payload = {
        "name": "Bad Site",
        "site_code": "TST-BAD",
        "ecosystem_type": "mangrove",
        "monitoring_status": "active",
        "boundary": INVALID_POLYGON,
        "notes": None,
    }
    resp = client.post(f"/api/v1/projects/{project_id}/sites", json=payload, headers=headers)
    assert resp.status_code == 422


def test_create_site_wrong_geometry_type(client):
    headers = register_and_login(client, email="sites3@example.com")
    project_id = _create_project(client, headers)

    payload = {
        "name": "Point Site",
        "site_code": "TST-PT",
        "ecosystem_type": "mangrove",
        "monitoring_status": "active",
        "boundary": {"type": "Point", "coordinates": [88.9, 21.6]},
        "notes": None,
    }
    resp = client.post(f"/api/v1/projects/{project_id}/sites", json=payload, headers=headers)
    assert resp.status_code == 422


def test_update_and_delete_site(client):
    headers = register_and_login(client, email="sites4@example.com")
    project_id = _create_project(client, headers)

    create_payload = {
        "name": "Editable Site",
        "site_code": "TST-EDIT",
        "ecosystem_type": "mangrove",
        "monitoring_status": "active",
        "boundary": VALID_POLYGON,
        "notes": None,
    }
    site_id = client.post(
        f"/api/v1/projects/{project_id}/sites", json=create_payload, headers=headers
    ).json()["id"]

    patch_resp = client.patch(
        f"/api/v1/sites/{site_id}",
        json={"monitoring_status": "paused"},
        headers=headers,
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["monitoring_status"] == "paused"

    delete_resp = client.delete(f"/api/v1/sites/{site_id}", headers=headers)
    assert delete_resp.status_code == 204

    get_resp = client.get(f"/api/v1/sites/{site_id}", headers=headers)
    assert get_resp.status_code == 404
