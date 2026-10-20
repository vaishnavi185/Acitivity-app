from fastapi.testclient import TestClient


def test_geocoding_search_and_reverse(client: TestClient, monkeypatch) -> None:
    from routes import geocoding

    expected_place = {
        "lat": 12.9716,
        "lon": 77.5946,
        "display_name": "Bengaluru, Karnataka, India",
    }
    monkeypatch.setattr(geocoding, "search_locations", lambda _query: [expected_place])
    monkeypatch.setattr(geocoding, "reverse_geocode", lambda _lat, _lon: expected_place)

    search = client.get("/geocoding/search", params={"q": "Bengaluru"})
    assert search.status_code == 200
    assert search.json() == [expected_place]

    reverse = client.get(
        "/geocoding/reverse",
        params={"lat": expected_place["lat"], "lon": expected_place["lon"]},
    )
    assert reverse.status_code == 200
    assert reverse.json() == expected_place


def test_geocoding_validates_query_and_coordinates(client: TestClient) -> None:
    assert client.get("/geocoding/search", params={"q": "a"}).status_code == 422
    assert client.get(
        "/geocoding/reverse",
        params={"lat": 91, "lon": 0},
    ).status_code == 422
