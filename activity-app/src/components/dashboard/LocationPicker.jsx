
"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

const DEFAULT_POSITION = [28.6139, 77.2090]; // Delhi, fallback only

const markerIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:20px;height:20px;background:#2563eb;
    border:3px solid white;border-radius:50%;
    box-shadow:0 1px 6px #555;
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MapController({ position }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(position, 16, { duration: 0.7 });
  }, [position, map]);

  return null;
}

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
}

export default function LocationPicker({
  onLocationSelect,
}) {
  const [position, setPosition] = useState(null);
  const [address, setAddress] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Convert coordinates to a readable address.
  async function getAddress(lat, lng) {
    try {
      const response = await fetch(
        `/api/geocode/reverse?lat=${lat}&lon=${lng}`
      );

      if (!response.ok) return;

      const data = await response.json();
      const newAddress = data.address || "";

      setAddress(newAddress);
      onLocationSelect?.({
        latitude: lat,
        longitude: lng,
        address: newAddress,
      });
    } catch {
      setMessage("Address nahi mil paya. Coordinates selected hain.");
    }
  }

  function selectPosition(nextPosition) {
    setPosition(nextPosition);
    setMessage("");

    // Update coordinates immediately; address may follow.
    onLocationSelect?.({
      latitude: nextPosition[0],
      longitude: nextPosition[1],
      address: "",
    });

    getAddress(nextPosition[0], nextPosition[1]);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setMessage("Browser location support nahi karta.");
      return;
    }

    setLoading(true);
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      (result) => {
        selectPosition([
          result.coords.latitude,
          result.coords.longitude,
        ]);
        setLoading(false);
      },
      (error) => {
        setMessage(
          error.code === 1
            ? "Location permission allow karo."
            : "Location nahi mil payi. GPS/location settings check karo."
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  async function searchAddress(event) {
    event.preventDefault();

    if (!query.trim()) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/geocode/search?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const results = await response.json();

      if (!results.length) {
        setMessage("Address nahi mila. Doosra search try karo.");
        return;
      }

      selectPosition([
        Number(results[0].lat),
        Number(results[0].lon),
      ]);
    } catch {
      setMessage("Address search nahi ho payi. Dobara try karo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <form onSubmit={searchAddress} style={{ display: "flex", gap: 8 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search city, area or address"
          aria-label="Search address"
          style={{
            flex: 1,
            minWidth: 0,
            padding: 12,
            border: "1px solid #ccc",
            borderRadius: 8,
          }}
        />
        <button type="submit" disabled={loading}>
          Search
        </button>
      </form>

      <button
        type="button"
        onClick={useCurrentLocation}
        disabled={loading}
      >
        {loading ? "Please wait..." : "Use Current Location"}
      </button>

      {message && <p role="status">{message}</p>}

      <div style={{ height: 400, width: "100%" }}>
        <MapContainer
          center={DEFAULT_POSITION}
          zoom={5}
          style={{
            height: "100%",
            width: "100%",
            borderRadius: 12,
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler onSelect={selectPosition} />

          {position && (
            <>
              <MapController position={position} />
              <Marker
                position={position}
                icon={markerIcon}
                draggable
                eventHandlers={{
                  dragend(event) {
                    const point = event.target.getLatLng();
                    selectPosition([point.lat, point.lng]);
                  },
                }}
              />
            </>
          )}
        </MapContainer>
      </div>

      {position && (
        <div>
          <p><strong>Selected address:</strong> {address || "Loading address..."}</p>
          <p>
            <strong>Latitude:</strong> {position[0].toFixed(6)}
          </p>
          <p>
            <strong>Longitude:</strong> {position[1].toFixed(6)}
          </p>
        </div>
      )}
    </section>
  );
}
