from uuid import uuid4

from fastapi.testclient import TestClient

from tests.helpers import activity_payload


def test_activity_create_filter_detail_update_delete(
    client: TestClient,
    create_user,
    create_category,
) -> None:
    owner = create_user()
    category = create_category()
    payload = activity_payload(category["id"])

    created = client.post(
        "/activities/",
        headers=owner["headers"],
        json=payload,
    )
    assert created.status_code == 201, created.text
    activity = created.json()
    activity_id = activity["id"]
    assert activity["title"] == payload["title"]
    assert activity["host_id"] == owner["user"]["id"]
    assert activity["category"] == category["name"]
    assert activity["available_slots"] == 3
    assert activity["total_group_size"] == 4

    filtered = client.get(
        "/activities/",
        params={"search": "Basketball", "category_id": category["id"]},
    )
    assert filtered.status_code == 200
    assert [item["id"] for item in filtered.json()] == [activity_id]
    assert client.get("/activities/", params={"search": "No Match"}).json() == []

    details = client.get(f"/activities/{activity_id}")
    assert details.status_code == 200
    assert details.json()["host"]["name"] == owner["user"]["full_name"]

    changed = client.patch(
        f"/activities/{activity_id}",
        headers=owner["headers"],
        json={"title": "Saturday Basketball"},
    )
    assert changed.status_code == 200
    assert changed.json()["title"] == "Saturday Basketball"
    assert client.get(f"/activities/{activity_id}").json()["title"] == "Saturday Basketball"

    deleted = client.delete(f"/activities/{activity_id}", headers=owner["headers"])
    assert deleted.status_code == 204
    assert client.get(f"/activities/{activity_id}").status_code == 404


def test_join_leave_likes_bookmarks_and_ownership(
    client: TestClient,
    create_user,
    create_category,
) -> None:
    host = create_user()
    attendee = create_user()
    category = create_category()
    created = client.post(
        "/activities/",
        headers=host["headers"],
        json=activity_payload(category["id"], title="Morning Run"),
    )
    assert created.status_code == 201, created.text
    activity_id = created.json()["id"]

    denied_delete = client.delete(
        f"/activities/{activity_id}",
        headers=attendee["headers"],
    )
    assert denied_delete.status_code == 403
    denied_update = client.patch(
        f"/activities/{activity_id}",
        headers=attendee["headers"],
        json={"title": "Unauthorized update"},
    )
    assert denied_update.status_code == 403

    joined = client.post(
        f"/activities/{activity_id}/join",
        headers=attendee["headers"],
    )
    assert joined.status_code == 200
    assert joined.json()["joined_count"] == 1
    assert joined.json()["available_slots"] == 2
    assert client.get("/activities/my/joined", headers=attendee["headers"]).json()[0]["id"] == activity_id
    assert client.get("/activities/my/joined/count", headers=attendee["headers"]).json() == 1
    assert client.post(
        f"/activities/{activity_id}/join",
        headers=attendee["headers"],
    ).status_code == 409

    liked = client.post(
        f"/activities/{activity_id}/like",
        headers=attendee["headers"],
    )
    assert liked.status_code == 200
    assert liked.json()["is_liked"] is True
    assert liked.json()["likes_count"] == 1

    bookmarked = client.post(
        f"/activities/{activity_id}/bookmark",
        headers=attendee["headers"],
    )
    assert bookmarked.status_code == 200
    assert bookmarked.json()["is_bookmarked"] is True
    saved = client.get("/users/me/bookmarks", headers=attendee["headers"])
    assert saved.status_code == 200
    assert saved.json()[0]["id"] == activity_id
    assert saved.json()[0]["is_liked"] is True

    unbookmarked = client.post(
        f"/activities/{activity_id}/bookmark",
        headers=attendee["headers"],
    )
    assert unbookmarked.json()["is_bookmarked"] is False
    unliked = client.post(
        f"/activities/{activity_id}/like",
        headers=attendee["headers"],
    )
    assert unliked.json()["is_liked"] is False
    assert unliked.json()["likes_count"] == 0

    left = client.post(
        f"/activities/{activity_id}/leave",
        headers=attendee["headers"],
    )
    assert left.status_code == 200
    assert left.json()["joined_count"] == 0
    assert client.get("/activities/my/joined", headers=attendee["headers"]).json() == []


def test_activity_validation_auth_and_missing_ids(
    client: TestClient,
    create_user,
    create_category,
) -> None:
    category = create_category()
    payload = activity_payload(category["id"])
    assert client.post("/activities/", json=payload).status_code == 401

    owner = create_user()
    bad_times = {**payload, "start_time": "11:00", "end_time": "10:00"}
    assert client.post(
        "/activities/",
        headers=owner["headers"],
        json=bad_times,
    ).status_code == 400

    invalid_schema = {**payload, "additional_needed": 0}
    assert client.post(
        "/activities/",
        headers=owner["headers"],
        json=invalid_schema,
    ).status_code == 422

    missing_category = {**payload, "category_id": 999}
    assert client.post(
        "/activities/",
        headers=owner["headers"],
        json=missing_category,
    ).status_code == 404

    missing_activity = str(uuid4())
    assert client.get(f"/activities/{missing_activity}").status_code == 404
    assert client.post(
        f"/activities/{missing_activity}/like",
        headers=owner["headers"],
    ).status_code == 404
