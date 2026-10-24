import uuid

from fastapi.testclient import TestClient


def test_registration_login_and_profile_update(client: TestClient) -> None:
    email = f"{uuid.uuid4().hex}@example.com"
    password = "StrongPass123!"
    registration_payload = {
        "full_name": "Vaishnavi Test",
        "email": email,
        "phone_number": "+91 98765 43210",
        "password": password,
        "location": "Bengaluru",
    }

    registered = client.post("/auth/register", json=registration_payload)

    assert registered.status_code == 201
    user = registered.json()
    assert user["full_name"] == registration_payload["full_name"]
    assert user["email"] == email
    assert user["phone_number"] == "+919876543210"
    assert user["location"] == "Bengaluru"
    assert set(user) == {"id", "full_name", "email", "phone_number", "location"}

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
    assert current_user.json()["phone_number"] == user["phone_number"]

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
    assert read_back.json()["phone_number"] == user["phone_number"]
    assert read_back.json()["bio"] == "Test profile"


def test_registration_schema_and_protected_route_rejections(
    client: TestClient,
) -> None:
    missing_phone = client.post(
        "/auth/register",
        json={
            "full_name": "Test Member",
            "email": f"{uuid.uuid4().hex}@example.com",
            "password": "StrongPass123!",
        },
    )
    assert missing_phone.status_code == 422

    invalid_payload = {
        "full_name": "A",
        "email": "not-an-email",
        "password": "short",
    }
    invalid_registration = client.post("/auth/register", json=invalid_payload)
    assert invalid_registration.status_code == 422

    invalid_phone = client.post(
        "/auth/register",
        json={
            "full_name": "Test Member",
            "email": f"{uuid.uuid4().hex}@example.com",
            "phone_number": "123",
            "password": "StrongPass123!",
        },
    )
    assert invalid_phone.status_code == 422

    missing_auth = client.get("/users/me")
    assert missing_auth.status_code == 401

    invalid_auth = client.get(
        "/users/me",
        headers={"Authorization": "Bearer invalid-token"},
    )
    assert invalid_auth.status_code == 401

    missing_user_auth = client.get("/auth/me")
    assert missing_user_auth.status_code == 401


def test_profiles_are_user_scoped_and_passwords_are_hashed(
    client: TestClient,
    create_user,
) -> None:
    from db.database import SessionLocal
    from models.user import User

    first = create_user()
    second = create_user()

    with SessionLocal() as db:
        stored_user = db.query(User).filter(User.id == first["user"]["id"]).one()
        assert stored_user.hashed_password != first["password"]
        assert stored_user.hashed_password.startswith("$2")

    update = client.put(
        "/users/me",
        headers=second["headers"],
        json={"full_name": "Private Profile Update", "bio": "Only for user two"},
    )
    assert update.status_code == 200
    assert client.get("/users/me", headers=first["headers"]).json()[
        "full_name"
    ] == first["user"]["full_name"]
    assert client.get("/users/me", headers=second["headers"]).json()[
        "full_name"
    ] == "Private Profile Update"


def test_database_failure_does_not_expose_internal_details(
    client: TestClient,
    monkeypatch,
) -> None:
    import main

    class FailingEngine:
        def connect(self):
            raise RuntimeError("postgres://private-user:private-password@db-host")

    monkeypatch.setattr(main, "engine", FailingEngine())

    response = client.get("/test-db")

    assert response.status_code == 503
    assert response.json() == {"detail": "Database unavailable"}
    assert "private-password" not in response.text
