from app.tests.conftest import register_and_login

PROJECT_PAYLOAD = {
    "name": "Alerts Project",
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
    "name": "Alerts Site",
    "site_code": "ALERT-001",
    "ecosystem_type": "forest",
    "monitoring_status": "active",
    "boundary": {
        "type": "Polygon",
        "coordinates": [[[88.9, 21.6], [88.95, 21.6], [88.95, 21.65], [88.9, 21.65], [88.9, 21.6]]],
    },
    "notes": None,
}


def _create_project_and_site(client, headers, *, site_code="ALERT-001"):
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


def _recalculate(client, headers, site_id):
    resp = client.post(f"/api/v1/sites/{site_id}/risk-assessment/recalculate", headers=headers)
    assert resp.status_code == 201
    return resp.json()


def _single_alert(client, headers, site_id):
    resp = client.get("/api/v1/alerts", params={"site_id": site_id}, headers=headers)
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) == 1
    return items[0]


def test_no_alert_when_all_conditions_pass(client):
    """All components clean/positive -> score 91, healthy, zero alerts."""
    headers = register_and_login(client, email="alerts_clean@example.com")
    _, site_id = _create_project_and_site(client, headers)

    _post_analytics(client, headers, site_id, recorded_at="2025-01-01")
    _post_analytics(
        client,
        headers,
        site_id,
        recorded_at="2025-04-01",
        carbon_captured_tco2e=120.0,
        biodiversity_score=60.0,
        species_count=24,
        vegetation_cover_percent=60.0,
    )

    body = _recalculate(client, headers, site_id)
    assert body["nature_health_score"] == 91
    assert body["score_band"] == "healthy"

    alerts_resp = client.get("/api/v1/alerts", params={"site_id": site_id}, headers=headers)
    assert alerts_resp.json()["total"] == 0

    summary_resp = client.get("/api/v1/dashboard/alerts-summary", headers=headers)
    assert summary_resp.status_code == 200
    assert summary_resp.json()["open_count"] == 0


def test_disturbance_high_condition(client):
    headers = register_and_login(client, email="alerts_dist@example.com")
    _, site_id = _create_project_and_site(client, headers)

    _post_analytics(client, headers, site_id, recorded_at="2025-01-01")
    _post_analytics(
        client,
        headers,
        site_id,
        recorded_at="2025-04-01",
        carbon_captured_tco2e=120.0,
        biodiversity_score=60.0,
        species_count=24,
        vegetation_cover_percent=60.0,
        disturbance_risk="high",
    )

    body = _recalculate(client, headers, site_id)
    assert body["nature_health_score"] == 82
    assert body["score_band"] == "healthy"

    alert = _single_alert(client, headers, site_id)
    assert alert["severity"] == "critical"
    assert alert["reasons"] == ["Disturbance risk increased from Low to High."]
    assert alert["status"] == "open"


def test_vegetation_decline_condition(client):
    headers = register_and_login(client, email="alerts_veg@example.com")
    _, site_id = _create_project_and_site(client, headers)

    _post_analytics(client, headers, site_id, recorded_at="2025-01-01")
    _post_analytics(
        client,
        headers,
        site_id,
        recorded_at="2025-04-01",
        carbon_captured_tco2e=120.0,
        biodiversity_score=60.0,
        species_count=24,
        vegetation_cover_percent=44.0,  # -12% vs baseline 50
    )

    body = _recalculate(client, headers, site_id)
    assert body["nature_health_score"] == 81
    assert body["score_band"] == "healthy"

    alert = _single_alert(client, headers, site_id)
    assert alert["severity"] == "high"
    assert alert["reasons"] == ["Vegetation cover decreased by 12% in the last three months."]


def test_biodiversity_decline_condition(client):
    headers = register_and_login(client, email="alerts_bio@example.com")
    _, site_id = _create_project_and_site(client, headers)

    _post_analytics(client, headers, site_id, recorded_at="2025-01-01")
    _post_analytics(
        client,
        headers,
        site_id,
        recorded_at="2025-04-01",
        carbon_captured_tco2e=120.0,
        biodiversity_score=44.0,  # -6 points vs baseline 50
        species_count=24,
        vegetation_cover_percent=60.0,
    )

    body = _recalculate(client, headers, site_id)
    assert body["nature_health_score"] == 78
    assert body["score_band"] == "watch"

    alert = _single_alert(client, headers, site_id)
    assert alert["severity"] == "high"
    assert alert["reasons"] == ["Biodiversity score decreased by 6 points."]


def test_soil_moisture_critical_condition(client):
    headers = register_and_login(client, email="alerts_soil@example.com")
    _, site_id = _create_project_and_site(client, headers)

    _post_analytics(client, headers, site_id, recorded_at="2025-01-01", soil_moisture_percent=40.0)
    _post_analytics(
        client,
        headers,
        site_id,
        recorded_at="2025-04-01",
        carbon_captured_tco2e=120.0,
        biodiversity_score=60.0,
        species_count=24,
        vegetation_cover_percent=60.0,
        soil_moisture_percent=15.0,  # < 20
    )

    body = _recalculate(client, headers, site_id)
    assert body["nature_health_score"] == 84
    assert body["score_band"] == "healthy"

    alert = _single_alert(client, headers, site_id)
    assert alert["severity"] == "high"
    assert alert["reasons"] == ["Soil moisture is critically low at 15%."]


def test_species_decline_condition(client):
    headers = register_and_login(client, email="alerts_species@example.com")
    _, site_id = _create_project_and_site(client, headers)

    _post_analytics(client, headers, site_id, recorded_at="2025-01-01", species_count=30)
    _post_analytics(
        client,
        headers,
        site_id,
        recorded_at="2025-04-01",
        carbon_captured_tco2e=120.0,
        biodiversity_score=60.0,
        species_count=24,  # -20% vs baseline 30
        vegetation_cover_percent=60.0,
    )

    body = _recalculate(client, headers, site_id)
    assert body["nature_health_score"] == 87
    assert body["score_band"] == "healthy"

    alert = _single_alert(client, headers, site_id)
    assert alert["severity"] == "medium"
    assert alert["reasons"] == ["Species observations declined by 20% in the last three months."]


def test_low_score_only_condition(client):
    headers = register_and_login(client, email="alerts_score@example.com")
    _, site_id = _create_project_and_site(client, headers)

    _post_analytics(client, headers, site_id, recorded_at="2025-01-01", species_count=20)
    _post_analytics(
        client,
        headers,
        site_id,
        recorded_at="2025-04-01",
        carbon_captured_tco2e=100.0,
        biodiversity_score=49.0,
        species_count=19,
        vegetation_cover_percent=48.5,
        soil_moisture_percent=80.0,
        ecosystem_health_score=90.0,
        disturbance_risk="low",
    )

    body = _recalculate(client, headers, site_id)
    assert body["nature_health_score"] == 66
    assert body["score_band"] == "watch"

    alert = _single_alert(client, headers, site_id)
    assert alert["severity"] == "medium"
    assert alert["reasons"] == ["Nature Health Score dropped to 66/100 (watch)."]


def test_alert_24h_dedupe(client):
    headers = register_and_login(client, email="alerts_dedupe@example.com")
    _, site_id = _create_project_and_site(client, headers)

    _post_analytics(client, headers, site_id, recorded_at="2025-01-01")
    _post_analytics(
        client,
        headers,
        site_id,
        recorded_at="2025-04-01",
        carbon_captured_tco2e=120.0,
        biodiversity_score=60.0,
        species_count=24,
        vegetation_cover_percent=60.0,
        disturbance_risk="high",
    )

    _recalculate(client, headers, site_id)
    _recalculate(client, headers, site_id)  # same alert-triggering conditions again

    resp = client.get("/api/v1/alerts", params={"site_id": site_id}, headers=headers)
    assert resp.json()["total"] == 1


def test_alert_ownership_cross_user_404(client):
    headers_a = register_and_login(client, email="alerts_owner_a@example.com")
    _, site_id = _create_project_and_site(client, headers_a)
    _post_analytics(client, headers_a, site_id, recorded_at="2025-01-01")
    _post_analytics(
        client,
        headers_a,
        site_id,
        recorded_at="2025-04-01",
        disturbance_risk="high",
        carbon_captured_tco2e=120.0,
        biodiversity_score=60.0,
        species_count=24,
        vegetation_cover_percent=60.0,
    )
    _recalculate(client, headers_a, site_id)
    alert = _single_alert(client, headers_a, site_id)

    headers_b = register_and_login(client, email="alerts_owner_b@example.com")
    list_resp = client.get("/api/v1/alerts", headers=headers_b)
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] == 0

    patch_resp = client.patch(
        f"/api/v1/alerts/{alert['id']}", json={"status": "acknowledged"}, headers=headers_b
    )
    assert patch_resp.status_code == 404


def test_alert_acknowledge_and_resolve_transitions(client):
    headers = register_and_login(client, email="alerts_transition@example.com")
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
    _recalculate(client, headers, site_id)
    alert = _single_alert(client, headers, site_id)

    ack_resp = client.patch(
        f"/api/v1/alerts/{alert['id']}",
        json={"status": "acknowledged", "reviewer_note": "Looking into it"},
        headers=headers,
    )
    assert ack_resp.status_code == 200
    assert ack_resp.json()["status"] == "acknowledged"
    assert ack_resp.json()["reviewer_note"] == "Looking into it"

    resolve_resp = client.patch(
        f"/api/v1/alerts/{alert['id']}", json={"status": "resolved"}, headers=headers
    )
    assert resolve_resp.status_code == 200
    assert resolve_resp.json()["status"] == "resolved"

    audit_resp = client.get("/api/v1/audit-logs", params={"site_id": site_id}, headers=headers)
    assert audit_resp.status_code == 200
    action_types = {item["action_type"] for item in audit_resp.json()["items"]}
    assert "acknowledged" in action_types
    assert "resolved" in action_types

    summary_resp = client.get("/api/v1/dashboard/alerts-summary", headers=headers)
    assert summary_resp.json()["resolved_count"] == 1
