from app.tests.conftest import register_and_login

PROJECT_PAYLOAD = {
    "name": "Risk Assessment Project",
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
    "name": "Risk Assessment Site",
    "site_code": "RISK-001",
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
    return site_id


def _post_analytics(client, headers, site_id, *, recorded_at, **overrides):
    payload = {
        "recorded_at": recorded_at,
        "carbon_captured_tco2e": 100.0,
        "biodiversity_score": 50.0,
        "species_count": 20,
        "vegetation_cover_percent": 40.0,
        "soil_moisture_percent": 30.0,
        "ecosystem_health_score": 70.0,
        "disturbance_risk": "low",
    }
    payload.update(overrides)
    resp = client.post(f"/api/v1/sites/{site_id}/analytics", json=payload, headers=headers)
    assert resp.status_code == 201
    return resp.json()


def test_get_risk_assessment_404_before_any_calculation(client):
    headers = register_and_login(client, email="risk1@example.com")
    site_id = _create_project_and_site(client, headers)

    resp = client.get(f"/api/v1/sites/{site_id}/risk-assessment", headers=headers)
    assert resp.status_code == 404


def test_known_score_hand_computed(client):
    """Hand-computed against the exact formula in docs/FEATURE_CONTRACT_V2.md.

    baseline (3 months before latest): biodiversity=50, vegetation=40,
    carbon=100, soil_moisture=30, species=20, disturbance=low.
    latest: ecosystem_health=85, biodiversity=60, carbon=104, vegetation=44,
    soil_moisture=30, species=22, disturbance=low.

    Component scores:
      ecosystem_health = 85
      biodiversity_trend: pct=(60-50)/50*100=20   -> score=clamp(50+40)=90
      vegetation_trend:   pct=(44-40)/40*100=10   -> score=clamp(50+20)=70
      carbon_trend:       pct=(104-100)/100*100=4 -> score=clamp(50+8)=58
      soil_moisture = 30 (direct)
      disturbance_risk = 100 (low)
      species_trend:      pct=(22-20)/20*100=10   -> score=clamp(50+20)=70

    score = 0.25*85 + 0.20*90 + 0.15*70 + 0.15*58 + 0.10*30 + 0.10*100 + 0.05*70
          = 21.25 + 18 + 10.5 + 8.7 + 3 + 10 + 3.5 = 74.95 -> round -> 75
    band: 65 <= 75 < 80 -> "watch"

    None of the alert conditions cross their thresholds, so this also covers
    the "no alert if all conditions pass" case.
    """
    headers = register_and_login(client, email="risk2@example.com")
    site_id = _create_project_and_site(client, headers)

    _post_analytics(
        client,
        headers,
        site_id,
        recorded_at="2025-03-01",
        carbon_captured_tco2e=100.0,
        biodiversity_score=50.0,
        species_count=20,
        vegetation_cover_percent=40.0,
        soil_moisture_percent=30.0,
        ecosystem_health_score=70.0,
        disturbance_risk="low",
    )
    _post_analytics(
        client,
        headers,
        site_id,
        recorded_at="2025-06-01",
        carbon_captured_tco2e=104.0,
        biodiversity_score=60.0,
        species_count=22,
        vegetation_cover_percent=44.0,
        soil_moisture_percent=30.0,
        ecosystem_health_score=85.0,
        disturbance_risk="low",
    )

    resp = client.post(f"/api/v1/sites/{site_id}/risk-assessment/recalculate", headers=headers)
    assert resp.status_code == 201
    body = resp.json()

    assert body["nature_health_score"] == 75
    assert body["score_band"] == "watch"
    assert body["carbon_trend"] == 4.0
    assert body["biodiversity_trend"] == 20.0
    assert body["vegetation_trend"] == 10.0
    assert body["soil_moisture_trend"] == 0.0
    assert body["disturbance_risk"] == "low"

    components = body["components"]
    assert components["ecosystem_health"] == 85.0
    assert components["biodiversity_trend"] == 90.0
    assert components["vegetation_trend"] == 70.0
    assert components["carbon_trend"] == 58.0
    assert components["soil_moisture"] == 30.0
    assert components["disturbance_risk"] == 100.0
    assert components["species_trend"] == 70.0

    weights = body["weights"]
    assert weights == {
        "ecosystem_health": 0.25,
        "biodiversity_trend": 0.20,
        "vegetation_trend": 0.15,
        "carbon_trend": 0.15,
        "soil_moisture": 0.10,
        "disturbance_risk": 0.10,
        "species_trend": 0.05,
    }

    # GET returns the same persisted assessment.
    get_resp = client.get(f"/api/v1/sites/{site_id}/risk-assessment", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == body["id"]
    assert get_resp.json()["nature_health_score"] == 75

    # No alert condition crossed its threshold -> no alert created.
    alerts_resp = client.get("/api/v1/alerts", params={"site_id": site_id}, headers=headers)
    assert alerts_resp.status_code == 200
    assert alerts_resp.json()["total"] == 0


def test_impact_timeline(client):
    headers = register_and_login(client, email="risk3@example.com")
    site_id = _create_project_and_site(client, headers)

    _post_analytics(
        client,
        headers,
        site_id,
        recorded_at="2025-01-01",
        carbon_captured_tco2e=100.0,
        biodiversity_score=50.0,
        species_count=20,
        vegetation_cover_percent=40.0,
    )
    _post_analytics(
        client,
        headers,
        site_id,
        recorded_at="2025-04-01",
        carbon_captured_tco2e=110.0,
        biodiversity_score=55.0,
        species_count=25,
        vegetation_cover_percent=44.0,
    )

    resp = client.get(f"/api/v1/sites/{site_id}/impact-timeline", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["first"]["recorded_at"] == "2025-01-01"
    assert body["latest"]["recorded_at"] == "2025-04-01"
    assert body["changes"]["carbon_pct"] == 10.0
    assert body["changes"]["biodiversity_points"] == 5.0
    assert body["changes"]["species_count_delta"] == 5
    # No risk assessment calculated yet -> not computable.
    assert body["changes"]["nature_health_score_delta"] is None
    assert "Over the last" in body["summary"]


def test_risk_assessment_cross_user_404(client):
    headers_a = register_and_login(client, email="risk4a@example.com")
    site_id = _create_project_and_site(client, headers_a)
    _post_analytics(client, headers_a, site_id, recorded_at="2025-01-01")
    client.post(f"/api/v1/sites/{site_id}/risk-assessment/recalculate", headers=headers_a)

    headers_b = register_and_login(client, email="risk4b@example.com")
    get_resp = client.get(f"/api/v1/sites/{site_id}/risk-assessment", headers=headers_b)
    assert get_resp.status_code == 404

    recalc_resp = client.post(
        f"/api/v1/sites/{site_id}/risk-assessment/recalculate", headers=headers_b
    )
    assert recalc_resp.status_code == 404

    timeline_resp = client.get(f"/api/v1/sites/{site_id}/impact-timeline", headers=headers_b)
    assert timeline_resp.status_code == 404
