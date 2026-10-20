import logging

from fastapi import APIRouter, HTTPException, Query

from schemas.geocoding import GeocodingResult
from service.geocoding_service import (
    GeocodingProviderError,
    reverse_geocode,
    search_locations,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/geocoding", tags=["Geocoding"])


@router.get("/search", response_model=list[GeocodingResult])
def search_places(
    q: str = Query(min_length=2, max_length=200),
) -> list[dict]:
    query = q.strip()
    if len(query) < 2:
        raise HTTPException(status_code=422, detail="Search query must contain at least 2 characters.")

    try:
        return search_locations(query)
    except GeocodingProviderError as error:
        logger.warning("Location search provider request failed: %s", error)
        raise HTTPException(
            status_code=502,
            detail="Location search is temporarily unavailable.",
        ) from error


@router.get("/reverse", response_model=GeocodingResult)
def reverse_geocode_place(
    lat: float = Query(ge=-90, le=90),
    lon: float = Query(ge=-180, le=180),
) -> dict:
    try:
        return reverse_geocode(lat, lon)
    except GeocodingProviderError as error:
        logger.warning("Reverse geocoding provider request failed: %s", error)
        raise HTTPException(
            status_code=502,
            detail="Address lookup is temporarily unavailable.",
        ) from error
