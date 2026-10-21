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


def test_feed_returns_activities_within_radius_ordered_by_distance(
    client: TestClient,
    create_user,
    create_category,
) -> None:
    host = create_user()
    category = create_category()
    near_payload = activity_payload(category["id"], title="Nearby plan")
    near_payload.update({"latitude": 12.9716, "longitude": 77.5946})
    far_payload = activity_payload(category["id"], title="Far plan")
    far_payload.update({"latitude": 13.4, "longitude": 77.6})
    nearest_payload = activity_payload(category["id"], title="Nearest plan")
    nearest_payload.update({"latitude": 12.972, "longitude": 77.5948})
    unlocated_payload = activity_payload(category["id"], title="Unlocated plan")

    created_ids = []
    for payload in (near_payload, far_payload, nearest_payload, unlocated_payload):
        response = client.post("/activities/", headers=host["headers"], json=payload)
        assert response.status_code == 201, response.text
        created_ids.append(response.json()["id"])

    response = client.get(
        "/activities/",
        params={
            "near_latitude": 12.9716,
            "near_longitude": 77.5946,
            "radius_km": 25,
        },
        headers=host["headers"],
    )
    assert response.status_code == 200
    assert [item["id"] for item in response.json()] == [
        created_ids[0],
        created_ids[2],
    ]
    assert response.json()[0]["distance_km"] < response.json()[1]["distance_km"]
    assert all(item["distance_km"] <= 25 for item in response.json())

    incomplete_location = client.get(
        "/activities/",
        params={"near_latitude": 12.9716},
    )
    assert incomplete_location.status_code == 422


def test_feed_filters_activities_posted_by_followed_buddies(
    client: TestClient,
    create_user,
    create_category,
) -> None:
    current_user = create_user(full_name="Current User")
    followed_buddy = create_user(full_name="Followed Buddy")
    unfollowed_user = create_user(full_name="Unfollowed User")
    other_viewer = create_user(full_name="Other Viewer")
    other_viewer_buddy = create_user(full_name="Other Viewer's Buddy")
    category = create_category()

    own_activity = client.post(
        "/activities/",
        headers=current_user["headers"],
        json=activity_payload(category["id"], title="My own activity"),
    )
    buddy_payload = activity_payload(category["id"], title="Buddy activity")
    buddy_payload["environment"] = "indoor"
    buddy_activity = client.post(
        "/activities/",
        headers=followed_buddy["headers"],
        json=buddy_payload,
    )
    other_activity = client.post(
        "/activities/",
        headers=unfollowed_user["headers"],
        json=activity_payload(category["id"], title="Other activity"),
    )
    other_viewer_activity = client.post(
        "/activities/",
        headers=other_viewer_buddy["headers"],
        json=activity_payload(category["id"], title="Other viewer buddy activity"),
    )
    assert buddy_activity.status_code == 201
    assert other_activity.status_code == 201
    assert other_viewer_activity.status_code == 201
    assert own_activity.status_code == 201

    followed = client.post(
        f"/buddies/{followed_buddy['user']['id']}",
        headers=current_user["headers"],
    )
    assert followed.status_code == 200
    buddy_joined_other_activity = client.post(
        f"/activities/{other_activity.json()['id']}/join",
        headers=followed_buddy["headers"],
    )
    assert buddy_joined_other_activity.status_code == 200
    other_followed = client.post(
        f"/buddies/{other_viewer_buddy['user']['id']}",
        headers=other_viewer["headers"],
    )
    assert other_followed.status_code == 200

    filtered = client.get(
        "/activities/",
        params={"posted_by_buddies": True},
        headers=current_user["headers"],
    )
    assert filtered.status_code == 200
    assert [item["id"] for item in filtered.json()] == [buddy_activity.json()["id"]]
    assert filtered.json()[0]["host_id"] == followed_buddy["user"]["id"]
    assert own_activity.json()["id"] not in [item["id"] for item in filtered.json()]
    assert other_viewer_activity.json()["id"] not in [
        item["id"] for item in filtered.json()
    ]

    combined_filters = client.get(
        "/activities/",
        params={
            "posted_by_buddies": True,
            "environment": "indoor",
            "search": "Buddy activity",
        },
        headers=current_user["headers"],
    )
    assert combined_filters.status_code == 200
    assert [item["id"] for item in combined_filters.json()] == [
        buddy_activity.json()["id"]
    ]

    assert client.get(
        "/activities/",
        params={"posted_by_buddies": True},
    ).status_code == 401


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
    assert joined.json()["is_joined"] is True
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
    assert left.json()["is_joined"] is False
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


def test_feed_and_details_return_persisted_interaction_state(
    client: TestClient,
    create_user,
    create_category,
) -> None:
    host = create_user()
    participant = create_user()
    other_user = create_user()
    category = create_category()
    created = client.post(
        "/activities/",
        headers=host["headers"],
        json=activity_payload(category["id"], title="Interaction State Check"),
    )
    activity_id = created.json()["id"]

    assert client.post(
        f"/activities/{activity_id}/like",
        headers=participant["headers"],
    ).status_code == 200
    assert client.post(
        f"/activities/{activity_id}/bookmark",
        headers=participant["headers"],
    ).status_code == 200

    participant_feed = client.get(
        "/activities/",
        headers=participant["headers"],
    )
    participant_item = next(
        item for item in participant_feed.json() if item["id"] == activity_id
    )
    assert participant_item["is_liked"] is True
    assert participant_item["is_bookmarked"] is True

    participant_details = client.get(
        f"/activities/{activity_id}",
        headers=participant["headers"],
    )
    assert participant_details.json()["is_liked"] is True
    assert participant_details.json()["is_bookmarked"] is True

    other_feed = client.get("/activities/", headers=other_user["headers"])
    other_item = next(
        item for item in other_feed.json() if item["id"] == activity_id
    )
    assert other_item["is_liked"] is False
    assert other_item["is_bookmarked"] is False
    assert client.get(
        "/activities/",
        headers={"Authorization": "Bearer malformed-token"},
    ).status_code == 401


def test_complete_two_user_activity_lifecycle(
    client: TestClient,
    create_user,
    create_category,
) -> None:
    owner = create_user()
    participant = create_user()
    category = create_category()

    profile = client.put(
        "/users/me",
        headers=owner["headers"],
        json={"bio": "Hosting weekend activities"},
    )
    assert profile.status_code == 200

    payload = activity_payload(category["id"], title="Lifecycle Hike")
    created = client.post("/activities/", headers=owner["headers"], json=payload)
    assert created.status_code == 201
    activity_id = created.json()["id"]

    discovered = client.get(
        "/activities/",
        params={"search": "lifecycle", "category_id": category["id"]},
    )
    assert [item["id"] for item in discovered.json()] == [activity_id]

    assert client.post(
        f"/activities/{activity_id}/join",
        headers=participant["headers"],
    ).status_code == 200
    assert client.post(
        f"/activities/{activity_id}/like",
        headers=participant["headers"],
    ).json()["is_liked"] is True
    assert client.post(
        f"/activities/{activity_id}/bookmark",
        headers=participant["headers"],
    ).json()["is_bookmarked"] is True

    participant_dashboard = client.get(
        "/dashboard/activities",
        params={"type": "joined"},
        headers=participant["headers"],
    )
    assert [item["id"] for item in participant_dashboard.json()] == [activity_id]
    participant_feed = client.get(
        "/activities/",
        headers=participant["headers"],
    )
    persisted = next(
        item for item in participant_feed.json() if item["id"] == activity_id
    )
    assert persisted["joined_count"] == 1
    assert persisted["is_liked"] is True
    assert persisted["is_bookmarked"] is True

    assert client.post(
        f"/activities/{activity_id}/leave",
        headers=participant["headers"],
    ).status_code == 200
    assert client.post(
        f"/activities/{activity_id}/like",
        headers=participant["headers"],
    ).json()["is_liked"] is False
    assert client.post(
        f"/activities/{activity_id}/bookmark",
        headers=participant["headers"],
    ).json()["is_bookmarked"] is False

    changed = client.patch(
        f"/activities/{activity_id}",
        headers=owner["headers"],
        json={"title": "Updated Lifecycle Hike"},
    )
    assert changed.status_code == 200
    assert changed.json()["title"] == "Updated Lifecycle Hike"
    assert client.delete(
        f"/activities/{activity_id}",
        headers=owner["headers"],
    ).status_code == 204

    assert client.get(f"/activities/{activity_id}").status_code == 404
    assert all(
        item["id"] != activity_id
        for item in client.get(
            "/dashboard/activities",
            params={"type": "joined"},
            headers=participant["headers"],
        ).json()
    )


def test_activity_capacity_and_host_join_rules(
    client: TestClient,
    create_user,
    create_category,
) -> None:
    host = create_user()
    first = create_user()
    second = create_user()
    category = create_category()
    payload = {
        **activity_payload(category["id"], title="Single Spot Activity"),
        "additional_needed": 1,
    }
    created = client.post("/activities/", headers=host["headers"], json=payload)
    activity_id = created.json()["id"]

    assert client.post(
        f"/activities/{activity_id}/join",
        headers=host["headers"],
    ).status_code == 409
    first_join = client.post(
        f"/activities/{activity_id}/join",
        headers=first["headers"],
    )
    assert first_join.status_code == 200
    assert first_join.json()["available_slots"] == 0
    assert client.post(
        f"/activities/{activity_id}/join",
        headers=second["headers"],
    ).status_code == 409

    assert client.post(
        f"/activities/{activity_id}/leave",
        headers=first["headers"],
    ).status_code == 200
    rejoined = client.post(
        f"/activities/{activity_id}/join",
        headers=second["headers"],
    )
    assert rejoined.status_code == 200
    assert rejoined.json()["joined_count"] == 1
