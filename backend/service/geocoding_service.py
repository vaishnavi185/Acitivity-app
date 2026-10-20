import os
import threading
import time
from functools import lru_cache
from typing import Any

import requests

NOMINATIM_URL = "https://nominatim.openstreetmap.org"
REQUEST_INTERVAL_SECONDS = 1.0
REQUEST_TIMEOUT_SECONDS = 10


class GeocodingProviderError(Exception):
    pass


_request_lock = threading.Lock()
_last_request_at = 0.0


def _request_nominatim(path: str, params: dict[str, str]) -> Any:
    global _last_request_at

    with _request_lock:
        delay = REQUEST_INTERVAL_SECONDS - (time.monotonic() - _last_request_at)
        if delay > 0:
            time.sleep(delay)

        try:
            response = requests.get(
                f"{NOMINATIM_URL}/{path}",
                params=params,
                headers={
                    "User-Agent": os.getenv(
                        "NOMINATIM_USER_AGENT",
                        "ActivityApp/1.0 (OpenStreetMap location picker)",
                    ),
                    "Accept-Language": "en",
                },
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
            _last_request_at = time.monotonic()
            response.raise_for_status()
            return response.json()
        except requests.RequestException as error:
            _last_request_at = time.monotonic()
            raise GeocodingProviderError("The location provider request failed.") from error
        except ValueError as error:
            raise GeocodingProviderError("The location provider returned invalid data.") from error


def _location_result(data: Any) -> dict[str, Any]:
    try:
        latitude = float(data["lat"])
        longitude = float(data["lon"])
        display_name = data["display_name"]
    except (KeyError, TypeError, ValueError) as error:
        raise GeocodingProviderError("The location provider returned an invalid place.") from error

    if (
        not -90 <= latitude <= 90
        or not -180 <= longitude <= 180
        or not isinstance(display_name, str)
        or not display_name.strip()
    ):
        raise GeocodingProviderError("The location provider returned an invalid place.")

    return {
        "lat": latitude,
        "lon": longitude,
        "display_name": display_name,
    }


@lru_cache(maxsize=256)
def search_locations(query: str) -> list[dict[str, Any]]:
    results = _request_nominatim(
        "search",
        {
            "q": query,
            "format": "jsonv2",
            "limit": "5",
            "addressdetails": "1",
        },
    )
    if not isinstance(results, list):
        raise GeocodingProviderError("The location provider returned invalid search results.")

    return [_location_result(result) for result in results]


@lru_cache(maxsize=512)
def _reverse_geocode(latitude: float, longitude: float) -> dict[str, Any]:
    result = _request_nominatim(
        "reverse",
        {
            "lat": str(latitude),
            "lon": str(longitude),
            "format": "jsonv2",
            "zoom": "18",
            "addressdetails": "1",
        },
    )
    return _location_result(result)


def reverse_geocode(latitude: float, longitude: float) -> dict[str, Any]:
    return _reverse_geocode(round(latitude, 5), round(longitude, 5))
