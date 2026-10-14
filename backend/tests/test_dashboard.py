from datetime import date, timedelta

from fastapi.testclient import TestClient

from tests.helpers import activity_payload


def test_dashboard_stats_and_activity_buckets(
    client: TestClient,
    create_user,
    create_category,
) -> None:
    host = create_user()
    attendee = create_user()
    category = create_category()

    upcoming_payload = activity_payload(category["id"], "Upcoming Hike")
    upcoming = client.post(
        "/activities/",
        headers=host["headers"],
        json=upcoming_payload,
    )
    assert upcoming.status_code == 201, upcoming.text

    past_payload = {
        **activity_payload(category["id"], "Past Hike"),
        "activity_date": (date.today() - timedelta(days=3)).isoformat(),
    }
    past = client.post(
        "/activities/",
        headers=host["headers"],
        json=past_payload,
    )
    assert past.status_code == 201, past.text

    joined = client.post(
        f"/activities/{upcoming.json()['id']}/join",
        headers=attendee["headers"],
    )
    assert joined.status_code == 200

    host_stats = client.get("/dashboard/stats", headers=host["headers"])
    assert host_stats.status_code == 200
    assert host_stats.json() == {
        "created_count": 2,
        "joined_count": 0,
        "upcoming_count": 1,
    }

    attendee_stats = client.get("/dashboard/stats", headers=attendee["headers"])
    assert attendee_stats.status_code == 200
    assert attendee_stats.json() == {
        "created_count": 0,
        "joined_count": 1,
        "upcoming_count": 1,
    }

    created = client.get(
        "/dashboard/activities",
        params={"type": "created"},
        headers=host["headers"],
    )
    assert created.status_code == 200
    assert {item["title"] for item in created.json()} == {"Upcoming Hike", "Past Hike"}

    joined_list = client.get(
        "/dashboard/activities",
        params={"type": "joined"},
        headers=attendee["headers"],
    )
    assert joined_list.status_code == 200
    assert [item["title"] for item in joined_list.json()] == ["Upcoming Hike"]

    upcoming_list = client.get(
        "/dashboard/activities",
        params={"type": "upcoming"},
        headers=host["headers"],
    )
    assert upcoming_list.status_code == 200
    assert [item["title"] for item in upcoming_list.json()] == ["Upcoming Hike"]

    past_list = client.get(
        "/dashboard/activities",
        params={"type": "past"},
        headers=host["headers"],
    )
    assert past_list.status_code == 200
    assert [item["title"] for item in past_list.json()] == ["Past Hike"]


def test_dashboard_requires_auth_and_valid_bucket(
    client: TestClient,
    create_user,
) -> None:
    assert client.get("/dashboard/stats").status_code == 401
    user = create_user()
    assert client.get(
        "/dashboard/activities",
        params={"type": "everything"},
        headers=user["headers"],
    ).status_code == 422
