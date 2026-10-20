import { authFetch } from "./AuthService";

export interface GeocodingResult {
  lat: number;
  lon: number;
  display_name: string;
}

export function searchLocations(query: string): Promise<GeocodingResult[]> {
  return authFetch(
    `/geocoding/search?q=${encodeURIComponent(query)}`
  ) as Promise<GeocodingResult[]>;
}

export function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodingResult> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
  });
  return authFetch(`/geocoding/reverse?${params.toString()}`) as Promise<GeocodingResult>;
}
