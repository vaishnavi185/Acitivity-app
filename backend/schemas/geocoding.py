from pydantic import BaseModel


class GeocodingResult(BaseModel):
    lat: float
    lon: float
    display_name: str
