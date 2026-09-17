from app.tests.conftest import register_and_login

PROJECT_PAYLOAD = {
    "name": "Dashboard Project",
    "description": "desc",
    "country": "India",
    "region": "Region",
    "project_type": "mangrove_restoration",
    "status": "active",
    "start_date": "2024-01-01",
    "end_date": None,
    "color": "#1b4332",
}

SITE_PAYLOAD = {
    "name": "Dashboard Site",
    "site_code": "DASH-001",
    "ecosystem_type": "mangrove",
    "monitoring_status": "active",
    "boundary": {
        "type": "Polygon",
        "coordinates": [[[88.9, 21.6], [88.95, 21.6], [88.95, 21.65], [88.9, 21.65], [88.9, 21.6]]],
    },
    "notes": None,
}


def test_dashboard_summary_shape_empty(client):
    headers = register_and_login(client, email="dash@example.com")
    resp = client.get("/api/v1/dashboard/summary", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    for key in [
        "total_projects",
        "total_active_sites",
        "total_area_hectares",
        "total_carbon_tco2e",
        "avg_biodiversity_score",
        "total_species_observed",
        "recent_projects",
        "recent_site_activity",
    ]:
        assert key in body
    assert body["total_projects"] == 0
    assert body["total_active_sites"] == 0
    assert body["avg_biodiversity_score"] is None
    assert body["recent_projects"] == []


def test_dashboard_summary_with_data(client):
    headers = register_and_login(client, email="dash2@example.com")
    project_id = client.post("/api/v1/projects", json=PROJECT_PAYLOAD, headers=headers).json()["id"]
    site_id = client.post(
        f"/api/v1/projects/{project_id}/sites", json=SITE_PAYLOAD, headers=headers
    ).json()["id"]
    client.post(
        f"/api/v1/sites/{site_id}/analytics",
        json={
            "recorded_at": "2025-01-01",
            "carbon_captured_tco2e": 100.0,
            "biodiversity_score": 70.0,
            "species_count": 20,
            "vegetation_cover_percent": 50.0,
            "soil_moisture_percent": 30.0,
            "ecosystem_health_score": 75.0,
            "disturbance_risk": "low",
        },
        headers=headers,
    )

    resp = client.get("/api/v1/dashboard/summary", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_projects"] == 1
    assert body["total_active_sites"] == 1
    assert body["total_area_hectares"] > 0
    assert body["total_carbon_tco2e"] == 100.0
    assert body["avg_biodiversity_score"] == 70.0
    assert len(body["recent_projects"]) == 1
    assert len(body["recent_site_activity"]) == 1

    map_resp = client.get("/api/v1/dashboard/map-sites", headers=headers)
    assert map_resp.status_code == 200
    map_items = map_resp.json()["items"]
    assert len(map_items) == 1
    assert map_items[0]["latest_carbon_tco2e"] == 100.0
