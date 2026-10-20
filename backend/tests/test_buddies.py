from fastapi.testclient import TestClient


def test_follow_unfollow_and_list_buddies(
    client: TestClient,
    create_user,
) -> None:
    first = create_user(full_name="First Member")
    second = create_user(full_name="Second Member")

    follow = client.post(
        f"/users/{second['user']['id']}/follow",
        headers=first["headers"],
    )
    assert follow.status_code == 200
    assert follow.json()["follower_id"] == first["user"]["id"]
    assert follow.json()["following_id"] == second["user"]["id"]

    duplicate_follow = client.post(
        f"/users/{second['user']['id']}/follow",
        headers=first["headers"],
    )
    assert duplicate_follow.status_code == 200
    assert duplicate_follow.json()["follower_id"] == first["user"]["id"]

    following = client.get("/users/me/following", headers=first["headers"])
    assert following.status_code == 200
    assert following.json()["total"] == 1
    assert [item["user"]["id"] for item in following.json()["items"]] == [
        second["user"]["id"]
    ]
    assert "email" not in following.json()["items"][0]["user"]

    followers = client.get("/users/me/followers", headers=second["headers"])
    assert followers.status_code == 200
    assert followers.json()["total"] == 1
    assert [item["user"]["id"] for item in followers.json()["items"]] == [
        first["user"]["id"]
    ]

    status = client.get(
        f"/users/{second['user']['id']}/buddy-status",
        headers=first["headers"],
    )
    assert status.status_code == 200
    assert status.json() == {
        "is_buddy": True,
        "is_follower": False,
        "buddies_count": 0,
        "followers_count": 1,
    }

    unfollow = client.delete(
        f"/users/{second['user']['id']}/follow",
        headers=first["headers"],
    )
    assert unfollow.status_code == 200
    assert unfollow.json() == {
        "message": "User unfollowed",
        "is_buddy": False,
    }

    repeat_unfollow = client.delete(
        f"/users/{second['user']['id']}/follow",
        headers=first["headers"],
    )
    assert repeat_unfollow.status_code == 200
    assert repeat_unfollow.json()["is_buddy"] is False
    assert client.get(
        "/users/me/following",
        headers=first["headers"],
    ).json() == {"total": 0, "items": []}


def test_follow_rejects_self_and_unknown_users(
    client: TestClient,
    create_user,
) -> None:
    member = create_user()

    self_follow = client.post(
        f"/users/{member['user']['id']}/follow",
        headers=member["headers"],
    )
    assert self_follow.status_code == 400

    unknown_follow = client.post(
        "/users/00000000-0000-0000-0000-000000000000/follow",
        headers=member["headers"],
    )
    assert unknown_follow.status_code == 404


def test_buddy_routes_require_authentication(client: TestClient) -> None:
    following = client.get("/users/me/following")
    assert following.status_code == 401

    follow = client.post(
        "/users/00000000-0000-0000-0000-000000000000/follow"
    )
    assert follow.status_code == 401


def test_buddies_router_is_registered_and_lists_are_paginated(
    client: TestClient,
    create_user,
) -> None:
    owner = create_user(full_name="Owner")
    followed_users = [
        create_user(full_name=f"Followed Member {index}")
        for index in range(3)
    ]

    for followed in followed_users:
        response = client.post(
            f"/buddies/{followed['user']['id']}",
            headers=owner["headers"],
        )
        assert response.status_code == 200
        assert response.json()["is_buddy"] is True

    openapi = client.get("/openapi.json")
    assert openapi.status_code == 200
    assert "/buddies/{user_id}/buddies" in openapi.json()["paths"]
    assert "/buddies/{user_id}/followers" in openapi.json()["paths"]
    assert "/buddies/{user_id}/status" in openapi.json()["paths"]

    buddies = client.get(
        f"/buddies/{owner['user']['id']}/buddies?limit=2&offset=1",
        headers=owner["headers"],
    )
    assert buddies.status_code == 200
    assert buddies.json()["total"] == 3
    assert len(buddies.json()["items"]) == 2

    followers = client.get(
        f"/buddies/{followed_users[0]['user']['id']}/followers",
        headers=owner["headers"],
    )
    assert followers.status_code == 200
    assert followers.json()["total"] == 1
    assert followers.json()["items"][0]["user"]["id"] == owner["user"]["id"]


def test_current_user_buddies_lists_only_authenticated_users_buddies(
    client: TestClient,
    create_user,
) -> None:
    owner = create_user(full_name="Owner")
    buddy = create_user(full_name="Buddy")
    other_user = create_user(full_name="Other User")

    followed = client.post(
        f"/buddies/{buddy['user']['id']}",
        headers=owner["headers"],
    )
    assert followed.status_code == 200

    response = client.get("/buddies/me", headers=owner["headers"])
    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["user"]["id"] == buddy["user"]["id"]
    assert response.json()["items"][0]["user"]["full_name"] == "Buddy"
    assert response.json()["items"][0]["user"]["id"] != other_user["user"]["id"]
    assert "email" not in response.json()["items"][0]["user"]


def test_current_user_buddies_supports_pagination_and_requires_auth(
    client: TestClient,
    create_user,
) -> None:
    owner = create_user(full_name="Owner")
    buddies = [
        create_user(full_name=f"Buddy {index}")
        for index in range(3)
    ]

    for buddy in buddies:
        response = client.post(
            f"/buddies/{buddy['user']['id']}",
            headers=owner["headers"],
        )
        assert response.status_code == 200

    paginated = client.get(
        "/buddies/me?limit=2&offset=1",
        headers=owner["headers"],
    )
    assert paginated.status_code == 200
    assert paginated.json()["total"] == 3
    assert len(paginated.json()["items"]) == 2

    assert client.get("/buddies/me").status_code == 401


def test_buddy_lists_reject_unknown_users(client: TestClient, create_user) -> None:
    member = create_user()
    unknown_id = "00000000-0000-0000-0000-000000000000"

    for endpoint in (
        f"/buddies/{unknown_id}/buddies",
        f"/buddies/{unknown_id}/followers",
        f"/buddies/{unknown_id}/status",
    ):
        response = client.get(endpoint, headers=member["headers"])
        assert response.status_code == 404
