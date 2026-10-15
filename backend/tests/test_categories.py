from fastapi.testclient import TestClient


def test_category_create_read_update_delete(
    client: TestClient,
    create_user,
) -> None:
    user = create_user()
    created = client.post(
        "/categories/",
        headers=user["headers"],
        json={
            "name": "Study Groups",
            "slug": "study-groups",
            "icon_name": "BookOpen",
        },
    )

    assert created.status_code == 201
    category = created.json()
    category_id = category["id"]
    assert category["name"] == "Study Groups"
    assert category["icon_name"] == "BookOpen"

    listed = client.get("/categories/")
    assert listed.status_code == 200
    assert any(item["id"] == category_id for item in listed.json())

    details = client.get(f"/categories/{category_id}")
    assert details.status_code == 200
    assert details.json()["slug"] == "study-groups"

    updated = client.patch(
        f"/categories/{category_id}",
        headers=user["headers"],
        json={"name": "Study Meetups", "icon_name": None},
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Study Meetups"
    assert updated.json()["icon_name"] is None

    deleted = client.delete(
        f"/categories/{category_id}",
        headers=user["headers"],
    )
    assert deleted.status_code == 204
    assert client.get(f"/categories/{category_id}").status_code == 404


def test_category_validation_and_duplicate_conflicts(
    client: TestClient,
    create_user,
) -> None:
    user = create_user()
    valid = {"name": "Board Games", "slug": "board-games"}
    assert client.post(
        "/categories/",
        headers=user["headers"],
        json=valid,
    ).status_code == 201
    assert client.post(
        "/categories/",
        headers=user["headers"],
        json=valid,
    ).status_code == 409

    invalid = client.post(
        "/categories/",
        headers=user["headers"],
        json={"name": "x", "slug": "x"},
    )
    assert invalid.status_code == 422
    assert client.patch(
        "/categories/999",
        headers=user["headers"],
        json={"name": "Missing"},
    ).status_code == 404


def test_category_mutations_require_authentication(
    client: TestClient,
    create_user,
) -> None:
    user = create_user()
    category = client.post(
        "/categories/",
        headers=user["headers"],
        json={"name": "Protected Category", "slug": "protected-category"},
    ).json()

    assert client.post(
        "/categories/",
        json={"name": "Anonymous Category", "slug": "anonymous-category"},
    ).status_code == 401
    assert client.patch(
        f"/categories/{category['id']}",
        json={"name": "Anonymous Edit"},
    ).status_code == 401
    assert client.delete(f"/categories/{category['id']}").status_code == 401
