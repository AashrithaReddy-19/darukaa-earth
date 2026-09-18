from app.tests.conftest import register_and_login

PROJECT_PAYLOAD = {
    "name": "Actions Project",
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
    "name": "Actions Site",
    "site_code": "ACT-001",
    "ecosystem_type": "forest",
    "monitoring_status": "active",
    "boundary": {
        "type": "Polygon",
        "coordinates": [[[88.9, 21.6], [88.95, 21.6], [88.95, 21.65], [88.9, 21.65], [88.9, 21.6]]],
    },
    "notes": None,
}


def _create_project_and_site(client, headers, *, site_code="ACT-001"):
    project_id = client.post("/api/v1/projects", json=PROJECT_PAYLOAD, headers=headers).json()["id"]
    payload = dict(SITE_PAYLOAD, site_code=site_code)
    site_id = client.post(
        f"/api/v1/projects/{project_id}/sites", json=payload, headers=headers
    ).json()["id"]
    return project_id, site_id


def _post_analytics(client, headers, site_id, *, recorded_at, **overrides):
    payload = {
        "recorded_at": recorded_at,
        "carbon_captured_tco2e": 100.0,
        "biodiversity_score": 50.0,
        "species_count": 20,
        "vegetation_cover_percent": 50.0,
        "soil_moisture_percent": 90.0,
        "ecosystem_health_score": 90.0,
        "disturbance_risk": "low",
    }
    payload.update(overrides)
    resp = client.post(f"/api/v1/sites/{site_id}/analytics", json=payload, headers=headers)
    assert resp.status_code == 201


def test_create_list_and_update_action(client):
    headers = register_and_login(client, email="actions1@example.com")
    _, site_id = _create_project_and_site(client, headers)

    payload = {
        "site_id": site_id,
        "title": "Quarterly field survey",
        "description": "Walk the site perimeter and log any new threats.",
        "action_category": "Field Survey",
        "priority": "medium",
        "due_date": "2025-08-01",
    }
    create_resp = client.post("/api/v1/actions", json=payload, headers=headers)
    assert create_resp.status_code == 201
    body = create_resp.json()
    assert body["status"] == "planned"
    assert body["alert_id"] is None
    assert body["site_id"] == site_id
    action_id = body["id"]

    list_resp = client.get("/api/v1/actions", headers=headers)
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] == 1

    filtered_resp = client.get("/api/v1/actions", params={"status": "in_progress"}, headers=headers)
    assert filtered_resp.json()["total"] == 0

    update_resp = client.patch(
        f"/api/v1/actions/{action_id}", json={"status": "in_progress"}, headers=headers
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "in_progress"

    complete_resp = client.patch(
        f"/api/v1/actions/{action_id}",
        json={"status": "completed", "priority": "low"},
        headers=headers,
    )
    assert complete_resp.status_code == 200
    assert complete_resp.json()["status"] == "completed"
    assert complete_resp.json()["priority"] == "low"

    summary_resp = client.get("/api/v1/dashboard/actions-summary", headers=headers)
    assert summary_resp.status_code == 200
    assert summary_resp.json()["by_status"]["completed"] == 1
    assert summary_resp.json()["by_status"]["planned"] == 0


def test_action_status_update_writes_audit_log(client):
    headers = register_and_login(client, email="actions2@example.com")
    project_id, site_id = _create_project_and_site(client, headers)

    payload = {
        "site_id": site_id,
        "title": "Restore mangrove nursery",
        "description": "Replant seedlings in the eroded fringe.",
        "action_category": "Habitat Restoration",
        "priority": "high",
    }
    action_id = client.post("/api/v1/actions", json=payload, headers=headers).json()["id"]

    client.patch(f"/api/v1/actions/{action_id}", json={"status": "in_progress"}, headers=headers)

    audit_resp = client.get(
        "/api/v1/audit-logs", params={"project_id": project_id}, headers=headers
    )
    assert audit_resp.status_code == 200
    action_entries = [
        item for item in audit_resp.json()["items"] if item["entity_type"] == "action"
    ]
    assert len(action_entries) == 2  # created + status update
    assert {item["action_type"] for item in action_entries} == {"created", "updated"}


def test_create_action_from_alert(client):
    headers = register_and_login(client, email="actions3@example.com")
    _, site_id = _create_project_and_site(client, headers)

    _post_analytics(client, headers, site_id, recorded_at="2025-01-01")
    _post_analytics(
        client,
        headers,
        site_id,
        recorded_at="2025-04-01",
        disturbance_risk="high",
        carbon_captured_tco2e=120.0,
        biodiversity_score=60.0,
        species_count=24,
        vegetation_cover_percent=60.0,
    )
    client.post(f"/api/v1/sites/{site_id}/risk-assessment/recalculate", headers=headers)

    alerts = client.get("/api/v1/alerts", params={"site_id": site_id}, headers=headers).json()[
        "items"
    ]
    assert len(alerts) == 1
    alert_id = alerts[0]["id"]

    payload = {
        "site_id": site_id,
        "alert_id": alert_id,
        "title": "Investigate disturbance alert",
        "description": "Send a field team to confirm the disturbance source.",
        "action_category": "Risk Investigation",
        "priority": "critical",
    }
    create_resp = client.post("/api/v1/actions", json=payload, headers=headers)
    assert create_resp.status_code == 201
    assert create_resp.json()["alert_id"] == alert_id

    list_resp = client.get("/api/v1/actions", params={"site_id": site_id}, headers=headers)
    assert list_resp.json()["items"][0]["alert_id"] == alert_id


def test_create_action_with_alert_from_another_owner_404(client):
    headers_a = register_and_login(client, email="actions_owner_a@example.com")
    _, site_id_a = _create_project_and_site(client, headers_a)
    _post_analytics(client, headers_a, site_id_a, recorded_at="2025-01-01")
    _post_analytics(
        client,
        headers_a,
        site_id_a,
        recorded_at="2025-04-01",
        disturbance_risk="high",
        carbon_captured_tco2e=120.0,
        biodiversity_score=60.0,
        species_count=24,
        vegetation_cover_percent=60.0,
    )
    client.post(f"/api/v1/sites/{site_id_a}/risk-assessment/recalculate", headers=headers_a)
    alert_id = client.get(
        "/api/v1/alerts", params={"site_id": site_id_a}, headers=headers_a
    ).json()["items"][0]["id"]

    headers_b = register_and_login(client, email="actions_owner_b@example.com")
    _, site_id_b = _create_project_and_site(client, headers_b, site_code="ACT-002")

    payload = {
        "site_id": site_id_b,
        "alert_id": alert_id,
        "title": "Cross-owner alert link attempt",
        "description": "Should not be allowed.",
        "action_category": "Risk Investigation",
        "priority": "low",
    }
    resp = client.post("/api/v1/actions", json=payload, headers=headers_b)
    assert resp.status_code == 404


def test_action_cross_user_404(client):
    headers_a = register_and_login(client, email="actions_x_a@example.com")
    _, site_id = _create_project_and_site(client, headers_a)
    payload = {
        "site_id": site_id,
        "title": "Owner-only action",
        "description": "desc",
        "action_category": "Monitoring",
        "priority": "low",
    }
    action_id = client.post("/api/v1/actions", json=payload, headers=headers_a).json()["id"]

    headers_b = register_and_login(client, email="actions_x_b@example.com")
    update_resp = client.patch(
        f"/api/v1/actions/{action_id}", json={"status": "completed"}, headers=headers_b
    )
    assert update_resp.status_code == 404

    create_resp = client.post(
        "/api/v1/actions",
        json={**payload, "site_id": site_id},
        headers=headers_b,
    )
    assert create_resp.status_code == 404
