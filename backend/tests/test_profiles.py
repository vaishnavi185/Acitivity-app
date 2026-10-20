from uuid import uuid4

from fastapi.testclient import TestClient

from tests.helpers import activity_payload


def create_activity(
    client: TestClient,
    host: dict,
    category_id: int,
    title: str,
) -> dict:
    response = client.post(
        "/activities/",
        headers=host["headers"],
        json=activity_payload(category_id, title=title),
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_public_profile_returns_buddy_state_and_hosted_count(
    client: TestClient,
    create_user,
    create_category,
) -> None:
    viewer = create_user(full_name="Profile Viewer")
    profile_user = create_user(full_name="Public Member")
    category = create_category()
    create_activity(client, profile_user, category["id"], "Hosted activity")
    create_activity(client, profile_user, category["id"], "Another activity")

    follow = client.post(
        f"/buddies/{profile_user['user']['id']}",
        headers=viewer["headers"],
    )
    assert follow.status_code == 200

    response = client.get(
        f"/profiles/{profile_user['user']['id']}",
        headers=viewer["headers"],
    )

    assert response.status_code == 200
    assert response.json() == {
        "id": profile_user["user"]["id"],
        "full_name": "Public Member",
        "location": "Test City",
        "avatar_url": None,
        "bio": None,
        "is_buddy": True,
        "is_follower": False,
        "buddies_count": 0,
        "followers_count": 1,
        "is_own_profile": False,
        "hosted_count": 2,
        "common_count": 0,
    }

    own_profile = client.get(
        f"/profiles/{viewer['user']['id']}",
        headers=viewer["headers"],
    )
    assert own_profile.status_code == 200
    assert own_profile.json()["is_own_profile"] is True
    assert own_profile.json()["common_count"] == 0


def test_profile_activity_tabs_intersect_host_and_confirmed_participation(
    client: TestClient,
    create_user,
    create_category,
) -> None:
    viewer = create_user(full_name="Viewer")
    profile_user = create_user(full_name="Profile User")
    third_user = create_user(full_name="Third Host")
    category = create_category()

    profile_hosted = create_activity(
        client, profile_user, category["id"], "Profile hosted, viewer joined"
    )
    viewer_hosted = create_activity(
        client, viewer, category["id"], "Viewer hosted, profile joined"
    )
    third_hosted = create_activity(
        client, third_user, category["id"], "Both users joined"
    )
    not_common = create_activity(
        client, profile_user, category["id"], "Not common"
    )

    assert client.post(
        f"/activities/{profile_hosted['id']}/join",
        headers=viewer["headers"],
    ).status_code == 200
    assert client.post(
        f"/activities/{viewer_hosted['id']}/join",
        headers=profile_user["headers"],
    ).status_code == 200
    for user in (viewer, profile_user):
        assert client.post(
            f"/activities/{third_hosted['id']}/join",
            headers=user["headers"],
        ).status_code == 200

    hosted = client.get(
        f"/profiles/{profile_user['user']['id']}/activities",
        params={"tab": "hosted"},
        headers=viewer["headers"],
    )
    assert hosted.status_code == 200
    assert hosted.json()["tab"] == "hosted"
    assert hosted.json()["total"] == 2
    assert {item["id"] for item in hosted.json()["items"]} == {
        profile_hosted["id"],
        not_common["id"],
    }
    assert all(
        {
            "available_slots",
            "total_group_size",
            "host",
            "category",
            "is_liked",
            "is_bookmarked",
            "is_joined",
        }
        <= item.keys()
        for item in hosted.json()["items"]
    )
    profile_hosted_item = next(
        item
        for item in hosted.json()["items"]
        if item["id"] == profile_hosted["id"]
    )
    assert profile_hosted_item["is_joined"] is True

    common = client.get(
        f"/profiles/{profile_user['user']['id']}/activities",
        params={"tab": "common", "limit": 2, "offset": 0},
        headers=viewer["headers"],
    )
    assert common.status_code == 200
    assert common.json()["total"] == 3
    common_profile = client.get(
        f"/profiles/{profile_user['user']['id']}",
        headers=viewer["headers"],
    )
    assert common_profile.status_code == 200
    assert common_profile.json()["common_count"] == 3
    assert len(common.json()["items"]) == 2
    assert {
        item["id"] for item in common.json()["items"]
    } <= {
        profile_hosted["id"],
        viewer_hosted["id"],
        third_hosted["id"],
    }

    own_common = client.get(
        f"/profiles/{viewer['user']['id']}/activities",
        params={"tab": "common"},
        headers=viewer["headers"],
    )
    assert own_common.status_code == 200
    assert own_common.json() == {"tab": "common", "total": 0, "items": []}


def test_profile_endpoints_validate_auth_user_and_pagination(
    client: TestClient,
    create_user,
) -> None:
    viewer = create_user()
    missing_user_id = str(uuid4())

    assert client.get(f"/profiles/{missing_user_id}").status_code == 401
    assert client.get(
        f"/profiles/{missing_user_id}/activities",
        headers=viewer["headers"],
    ).status_code == 404
    assert client.get(
        f"/profiles/{viewer['user']['id']}/activities",
        params={"tab": "invalid"},
        headers=viewer["headers"],
    ).status_code == 422
    assert client.get(
        f"/profiles/{viewer['user']['id']}/activities",
        params={"limit": 31},
        headers=viewer["headers"],
    ).status_code == 422
