from datetime import date, timedelta

from app.tests.conftest import register_and_login

PROJECT_PAYLOAD = {
    "name": "Analytics Project",
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
    "name": "Analytics Site",
    "site_code": "ANL-001",
    "ecosystem_type": "mangrove",
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
    return site_id


def test_analytics_range_filtering(client):
    headers = register_and_login(client, email="analytics@example.com")
    site_id = _create_project_and_site(client, headers)

    today = date.today()
    for i in range(14):
        recorded_at = today - timedelta(days=30 * i)
        payload = {
            "recorded_at": recorded_at.isoformat(),
            "carbon_captured_tco2e": 100 + i,
            "biodiversity_score": 50 + i,
            "species_count": 10 + i,
            "vegetation_cover_percent": 40.0,
            "soil_moisture_percent": 30.0,
            "ecosystem_health_score": 70.0,
            "disturbance_risk": "low",
        }
        resp = client.post(f"/api/v1/sites/{site_id}/analytics", json=payload, headers=headers)
        assert resp.status_code == 201

    all_resp = client.get(
        f"/api/v1/sites/{site_id}/analytics", params={"range": "all"}, headers=headers
    )
    assert all_resp.status_code == 200
    all_body = all_resp.json()
    assert all_body["site_id"] == site_id
    assert all_body["range"] == "all"
    all_records = all_body["records"]
    assert len(all_records) == 14
    assert all_body["latest"]["recorded_at"] == all_records[-1]["recorded_at"]

    recorded_dates = [r["recorded_at"] for r in all_records]
    assert recorded_dates == sorted(recorded_dates)

    three_month_resp = client.get(
        f"/api/v1/sites/{site_id}/analytics", params={"range": "3m"}, headers=headers
    )
    assert three_month_resp.status_code == 200
    three_month_records = three_month_resp.json()["records"]
    assert len(three_month_records) < len(all_records)


def test_species_observations(client):
    headers = register_and_login(client, email="species@example.com")
    site_id = _create_project_and_site(client, headers)

    resp = client.get(f"/api/v1/sites/{site_id}/species-observations", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["items"] == []
    assert set(body["by_category"].keys()) == {
        "Bird",
        "Mammal",
        "Reptile",
        "Amphibian",
        "Plant",
        "Insect",
    }
    assert all(count == 0 for count in body["by_category"].values())
