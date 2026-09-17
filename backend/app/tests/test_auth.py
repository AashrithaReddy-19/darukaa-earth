from app.tests.conftest import register_and_login


def test_register_success(client):
    resp = client.post(
        "/api/v1/auth/register",
        json={"full_name": "Alice", "email": "alice@example.com", "password": "Password123"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "alice@example.com"
    assert body["full_name"] == "Alice"
    assert body["is_active"] is True
    assert "id" in body
    assert "hashed_password" not in body


def test_register_duplicate_email(client):
    payload = {"full_name": "Alice", "email": "dup@example.com", "password": "Password123"}
    first = client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201
    second = client.post("/api/v1/auth/register", json=payload)
    assert second.status_code == 409


def test_login_success(client):
    client.post(
        "/api/v1/auth/register",
        json={"full_name": "Bob", "email": "bob@example.com", "password": "Password123"},
    )
    resp = client.post(
        "/api/v1/auth/login", json={"email": "bob@example.com", "password": "Password123"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["token_type"] == "bearer"
    assert body["expires_in"] > 0


def test_login_bad_credentials(client):
    resp = client.post(
        "/api/v1/auth/login", json={"email": "nouser@example.com", "password": "wrongpass"}
    )
    assert resp.status_code == 401


def test_me_requires_auth(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401


def test_me_with_token(client):
    headers = register_and_login(client, email="carol@example.com")
    resp = client.get("/api/v1/auth/me", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "carol@example.com"


def test_refresh_rotates_tokens(client):
    register_and_login(client, email="dave@example.com")
    login_resp = client.post(
        "/api/v1/auth/login", json={"email": "dave@example.com", "password": "Password123"}
    )
    refresh_token = login_resp.json()["refresh_token"]

    resp = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert "refresh_token" in body


def test_refresh_rejects_bad_token(client):
    resp = client.post("/api/v1/auth/refresh", json={"refresh_token": "not-a-real-token"})
    assert resp.status_code == 401
