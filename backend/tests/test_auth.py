import uuid

from fastapi.testclient import TestClient


def test_registration_login_and_profile_update(client: TestClient) -> None:
    email = f"{uuid.uuid4().hex}@example.com"
    password = "StrongPass123!"
    registration_payload = {
        "full_name": "Vaishnavi Test",
        "email": email,
        "password": password,
        "location": "Bengaluru",
    }

    registered = client.post("/auth/register", json=registration_payload)

    assert registered.status_code == 201
    user = registered.json()
    assert user["full_name"] == registration_payload["full_name"]
    assert user["email"] == email
    assert user["location"] == "Bengaluru"
    assert set(user) == {"id", "full_name", "email", "location"}

    duplicate = client.post("/auth/register", json=registration_payload)
    assert duplicate.status_code == 400

    invalid_login = client.post(
        "/auth/login",
        json={"email": email, "password": "WrongPass123!"},
    )
    assert invalid_login.status_code == 401

    login = client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    assert login.status_code == 200
    assert login.json()["token_type"] == "bearer"
    assert login.json()["access_token"]
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    current_user = client.get("/auth/me", headers=headers)
    assert current_user.status_code == 200
    assert current_user.json()["id"] == user["id"]

    updated = client.put(
        "/users/me",
        headers=headers,
        json={"full_name": "Updated Test Member", "bio": "Test profile"},
    )
    assert updated.status_code == 200
    assert updated.json()["full_name"] == "Updated Test Member"
    assert updated.json()["bio"] == "Test profile"

    read_back = client.get("/users/me", headers=headers)
    assert read_back.status_code == 200
    assert read_back.json()["full_name"] == "Updated Test Member"
    assert read_back.json()["bio"] == "Test profile"


def test_registration_schema_and_protected_route_rejections(
    client: TestClient,
) -> None:
    invalid_payload = {
        "full_name": "A",
        "email": "not-an-email",
        "password": "short",
        "phone": "555-0100",
    }
    invalid_registration = client.post("/auth/register", json=invalid_payload)
    assert invalid_registration.status_code == 422

    missing_auth = client.get("/users/me")
    assert missing_auth.status_code == 401

    invalid_auth = client.get(
        "/users/me",
        headers={"Authorization": "Bearer invalid-token"},
    )
    assert invalid_auth.status_code == 401

    missing_user_auth = client.get("/auth/me")
    assert missing_user_auth.status_code == 401
