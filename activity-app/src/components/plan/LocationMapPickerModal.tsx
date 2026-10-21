"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { LoaderCircle, MapPin, Search, X } from "lucide-react";
import {
  reverseGeocode,
  searchLocations,
  type GeocodingResult,
} from "@/service/geocodingService";

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface InitialSelection extends Coordinates {
  address: string;
}

export interface LocationMapSelection extends Coordinates {
  address: string;
}

interface LocationMapPickerModalProps {
  title?: string;
  initialSelection: InitialSelection | null;
  onCancel: () => void;
  onConfirm: (selection: LocationMapSelection) => void;
}

type MapPosition = [number, number];

const DEFAULT_POSITION: MapPosition = [20, 0];
const COORDINATE_ONLY_ADDRESS = /^-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?$/;
const markerIcon = L.divIcon({
  className: "",
  html: '<div class="location-picker-marker"></div>',
  iconSize: [24, 32],
  iconAnchor: [12, 30],
});

function MapController({ position }: { position: MapPosition | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, Math.max(map.getZoom(), 15), { animate: true });
    }
  }, [map, position]);

  return null;
}

function MapClickHandler({
  onSelect,
}: {
  onSelect: (position: MapPosition) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
}

export function LocationMapPickerModal({
  title = "Choose a meeting location",
  initialSelection,
  onCancel,
  onConfirm,
}: LocationMapPickerModalProps) {
  const initialPosition: MapPosition | null = initialSelection
    ? [initialSelection.latitude, initialSelection.longitude]
    : null;
  const [position, setPosition] = useState<MapPosition | null>(initialPosition);
  const [address, setAddress] = useState(initialSelection?.address ?? "");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [message, setMessage] = useState("");
  const reverseRequestId = useRef(0);
  const searchRequestId = useRef(0);

  const selectPosition = async (
    nextPosition: MapPosition,
    knownAddress?: string
  ) => {
    const requestId = ++reverseRequestId.current;
    setPosition(nextPosition);
    const readableKnownAddress =
      knownAddress && !COORDINATE_ONLY_ADDRESS.test(knownAddress.trim())
        ? knownAddress
        : "";
    setAddress(readableKnownAddress);
    setMessage("");
    setResults([]);

    if (readableKnownAddress) {
      setIsReverseGeocoding(false);
      return;
    }

    setIsReverseGeocoding(true);
    try {
      const result = await reverseGeocode(nextPosition[0], nextPosition[1]);
      if (requestId === reverseRequestId.current) {
        if (
          !result.display_name.trim() ||
          COORDINATE_ONLY_ADDRESS.test(result.display_name.trim())
        ) {
          throw new Error("No readable address was found for this point.");
        }
        setAddress(result.display_name);
      }
    } catch {
      if (requestId === reverseRequestId.current) {
        setMessage("Could not find a readable address for this point. Search for a nearby place or select another point.");
      }
    } finally {
      if (requestId === reverseRequestId.current) {
        setIsReverseGeocoding(false);
      }
    }
  };

  const handleSearch = async () => {
    const searchQuery = query.trim();
    if (searchQuery.length < 2) {
      setMessage("Enter at least 2 characters to search for a place.");
      setResults([]);
      return;
    }

    const requestId = ++searchRequestId.current;
    setIsSearching(true);
    setMessage("");
    setResults([]);
    try {
      const searchResults = await searchLocations(searchQuery);
      if (requestId !== searchRequestId.current) return;
      setResults(searchResults);
      if (searchResults.length === 0) {
        setMessage("No places found. Try a nearby street, area, or landmark.");
      }
    } catch {
      if (requestId === searchRequestId.current) {
        setMessage("Place search is unavailable right now. Please try again.");
      }
    } finally {
      if (requestId === searchRequestId.current) {
        setIsSearching(false);
      }
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Your browser does not support location access. Search for a place or choose it on the map.");
      return;
    }

    setIsLocating(true);
    setMessage("");
    navigator.geolocation.getCurrentPosition(
      (result) => {
        void selectPosition([
          result.coords.latitude,
          result.coords.longitude,
        ]);
        setIsLocating(false);
      },
      (error) => {
        setMessage(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied. Allow location access in your browser or choose a point on the map."
            : error.code === error.POSITION_UNAVAILABLE
              ? "Your current location is unavailable. Check your device location settings or choose a point on the map."
              : "Could not get your location in time. Please try again or choose a point on the map."
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  const handleConfirm = () => {
    if (!position || !address.trim()) {
      setMessage("Select a place with a readable address before confirming.");
      return;
    }

    onConfirm({
      latitude: position[0],
      longitude: position[1],
      address: address.trim(),
    });
  };

  const isBusy = isSearching || isLocating;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/55 p-3 backdrop-blur-sm sm:p-5"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-picker-title"
        className="my-auto flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between border-b border-neutral-100 p-5 sm:p-6">
          <div>
            <h2 id="location-picker-title" className="text-lg font-black text-neutral-900 sm:text-xl">
              {title}
            </h2>
            <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
              Search, use your current location, or click and drag the pin on the map.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close location picker"
            className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-4 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search for a place or address</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleSearch();
                  }
                }}
                placeholder="Search a place, area, or address"
                className="w-full rounded-2xl border border-neutral-200 bg-white py-3 pl-10 pr-4 text-sm text-neutral-800 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </label>
            <button
              type="button"
              onClick={() => void handleSearch()}
              disabled={isBusy}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSearching ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </button>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isBusy}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700 transition-colors hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLocating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              <span className="whitespace-nowrap">Use My Current Location</span>
            </button>
          </div>

          {results.length > 0 && (
            <ul className="max-h-36 space-y-1 overflow-y-auto rounded-2xl border border-neutral-200 p-1">
              {results.map((result, index) => (
                <li key={`${result.lat}:${result.lon}:${index}`}>
                  <button
                    type="button"
                    onClick={() => void selectPosition([result.lat, result.lon], result.display_name)}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm text-neutral-700 transition-colors hover:bg-orange-50"
                  >
                    {result.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="h-[38vh] min-h-64 max-h-[480px] overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 sm:h-[45vh]">
            <MapContainer
              center={position ?? DEFAULT_POSITION}
              zoom={position ? 15 : 2}
              scrollWheelZoom
              className="location-picker-map h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onSelect={(nextPosition) => void selectPosition(nextPosition)} />
              <MapController position={position} />
              {position && (
                <Marker
                  position={position}
                  icon={markerIcon}
                  draggable
                  eventHandlers={{
                    dragend(event) {
                      const nextPosition = event.target.getLatLng();
                      void selectPosition([nextPosition.lat, nextPosition.lng]);
                    },
                  }}
                />
              )}
            </MapContainer>
          </div>

          <div aria-live="polite" className="min-h-5 text-sm">
            {message && <p role="status" className="text-rose-600">{message}</p>}
            {position && (
              <div className="space-y-1 text-neutral-600">
                <p>
                  <span className="font-bold text-neutral-800">Selected address: </span>
                  {isReverseGeocoding ? "Finding address…" : address || "No readable address found yet."}
                </p>
              </div>
            )}
          </div>
        </div>

        <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-neutral-100 p-4 sm:flex-row sm:justify-end sm:p-5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-5 py-2.5 text-sm font-bold text-neutral-600 transition-colors hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!position || isReverseGeocoding || !address.trim()}
            className="rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition-all hover:from-orange-600 hover:to-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirm Location
          </button>
        </footer>
      </section>
    </div>,
    document.body
  );
}
