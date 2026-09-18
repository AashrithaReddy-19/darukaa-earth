from app.tests.conftest import register_and_login

PROJECT_PAYLOAD = {
    "name": "Field Observation Project",
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
    "name": "Field Observation Site",
    "site_code": "OBS-001",
    "ecosystem_type": "forest",
    "monitoring_status": "active",
    "boundary": {
        "type": "Polygon",
        "coordinates": [[[88.9, 21.6], [88.95, 21.6], [88.95, 21.65], [88.9, 21.65], [88.9, 21.6]]],
    },
    "notes": None,
}


def _create_project_and_site(client, headers):
    project_id = client.post("/api/v1/projects", json=PROJECT_PAYLOAD, headers=headers).json()["id"]
    site_id = client.post(
        f"/api/v1/projects/{project_id}/sites", json=SITE_PAYLOAD, headers=headers
    ).json()["id"]
    return project_id, site_id


def test_create_and_list_field_observations(client):
    headers = register_and_login(client, email="obs1@example.com")
    _, site_id = _create_project_and_site(client, headers)

    empty_resp = client.get(f"/api/v1/sites/{site_id}/field-observations", headers=headers)
    assert empty_resp.status_code == 200
    assert empty_resp.json() == {"items": [], "total": 0}

    payload = {
        "observer_name": "Jane Ranger",
        "observation_type": "Species",
        "notes": "Spotted a pair of hornbills near the eastern boundary.",
        "latitude": 21.61,
        "longitude": 88.91,
        "observation_date": "2025-05-01",
    }
    create_resp = client.post(
        f"/api/v1/sites/{site_id}/field-observations", json=payload, headers=headers
    )
    assert create_resp.status_code == 201
    body = create_resp.json()
    assert body["site_id"] == site_id
    assert body["observer_name"] == "Jane Ranger"
    assert body["observation_type"] == "Species"
    assert body["latitude"] == 21.61

    second_payload = dict(payload, observation_type="Threat", notes="Signs of illegal logging.")
    client.post(f"/api/v1/sites/{site_id}/field-observations", json=second_payload, headers=headers)

    list_resp = client.get(f"/api/v1/sites/{site_id}/field-observations", headers=headers)
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] == 2

    filtered_resp = client.get(
        f"/api/v1/sites/{site_id}/field-observations",
        params={"observation_type": "Threat"},
        headers=headers,
    )
    assert filtered_resp.status_code == 200
    assert filtered_resp.json()["total"] == 1
    assert filtered_resp.json()["items"][0]["observation_type"] == "Threat"


def test_field_observation_requires_valid_type(client):
    headers = register_and_login(client, email="obs2@example.com")
    _, site_id = _create_project_and_site(client, headers)

    payload = {
        "observer_name": "Jane Ranger",
        "observation_type": "NotARealType",
        "notes": "notes",
        "observation_date": "2025-05-01",
    }
    resp = client.post(f"/api/v1/sites/{site_id}/field-observations", json=payload, headers=headers)
    assert resp.status_code == 422


def test_field_observation_writes_audit_log(client):
    headers = register_and_login(client, email="obs3@example.com")
    project_id, site_id = _create_project_and_site(client, headers)

    payload = {
        "observer_name": "Jane Ranger",
        "observation_type": "Habitat",
        "notes": "Canopy cover looks healthy this quarter.",
        "observation_date": "2025-05-01",
    }
    client.post(f"/api/v1/sites/{site_id}/field-observations", json=payload, headers=headers)

    audit_resp = client.get(
        "/api/v1/audit-logs", params={"project_id": project_id}, headers=headers
    )
    assert audit_resp.status_code == 200
    entity_types = {item["entity_type"] for item in audit_resp.json()["items"]}
    assert "field_observation" in entity_types


def test_field_observation_cross_user_404(client):
    headers_a = register_and_login(client, email="obs_owner_a@example.com")
    _, site_id = _create_project_and_site(client, headers_a)

    headers_b = register_and_login(client, email="obs_owner_b@example.com")

    list_resp = client.get(f"/api/v1/sites/{site_id}/field-observations", headers=headers_b)
    assert list_resp.status_code == 404

    payload = {
        "observer_name": "Intruder",
        "observation_type": "Other",
        "notes": "notes",
        "observation_date": "2025-05-01",
    }
    create_resp = client.post(
        f"/api/v1/sites/{site_id}/field-observations", json=payload, headers=headers_b
    )
    assert create_resp.status_code == 404
