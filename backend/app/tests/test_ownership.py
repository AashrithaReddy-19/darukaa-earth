from app.tests.conftest import register_and_login

PROJECT_PAYLOAD = {
    "name": "Owned By A",
    "description": "desc",
    "country": "India",
    "region": "Region",
    "project_type": "forest_conservation",
    "status": "planning",
    "start_date": "2024-01-01",
    "end_date": None,
    "color": "#1b4332",
}

SITE_PAYLOAD = {
    "name": "A Site",
    "site_code": "OWN-001",
    "ecosystem_type": "mangrove",
    "monitoring_status": "active",
    "boundary": {
        "type": "Polygon",
        "coordinates": [[[88.9, 21.6], [88.95, 21.6], [88.95, 21.65], [88.9, 21.65], [88.9, 21.6]]],
    },
    "notes": None,
}


def test_user_cannot_access_other_users_project(client):
    headers_a = register_and_login(client, email="a@example.com")
    resp = client.post("/api/v1/projects", json=PROJECT_PAYLOAD, headers=headers_a)
    project_id = resp.json()["id"]

    headers_b = register_and_login(client, email="b@example.com")

    get_resp = client.get(f"/api/v1/projects/{project_id}", headers=headers_b)
    assert get_resp.status_code == 404

    patch_resp = client.patch(
        f"/api/v1/projects/{project_id}", json={"name": "Hijack"}, headers=headers_b
    )
    assert patch_resp.status_code == 404

    delete_resp = client.delete(f"/api/v1/projects/{project_id}", headers=headers_b)
    assert delete_resp.status_code == 404

    # Project still exists and is untouched for the real owner.
    owner_get = client.get(f"/api/v1/projects/{project_id}", headers=headers_a)
    assert owner_get.status_code == 200
    assert owner_get.json()["name"] == "Owned By A"


def test_user_cannot_access_other_users_site(client):
    headers_a = register_and_login(client, email="c@example.com")
    project_id = client.post("/api/v1/projects", json=PROJECT_PAYLOAD, headers=headers_a).json()[
        "id"
    ]
    site_id = client.post(
        f"/api/v1/projects/{project_id}/sites", json=SITE_PAYLOAD, headers=headers_a
    ).json()["id"]

    headers_b = register_and_login(client, email="d@example.com")

    get_site_resp = client.get(f"/api/v1/sites/{site_id}", headers=headers_b)
    assert get_site_resp.status_code == 404

    patch_site_resp = client.patch(
        f"/api/v1/sites/{site_id}", json={"notes": "hijacked"}, headers=headers_b
    )
    assert patch_site_resp.status_code == 404

    delete_site_resp = client.delete(f"/api/v1/sites/{site_id}", headers=headers_b)
    assert delete_site_resp.status_code == 404

    list_sites_resp = client.get(f"/api/v1/projects/{project_id}/sites", headers=headers_b)
    assert list_sites_resp.status_code == 404

    analytics_resp = client.get(f"/api/v1/sites/{site_id}/analytics", headers=headers_b)
    assert analytics_resp.status_code == 404
