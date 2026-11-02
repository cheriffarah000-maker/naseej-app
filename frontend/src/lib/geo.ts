import type { LatLng } from './types';

/** Tunis city centre — the map's default viewpoint. */
export const TUNIS: LatLng = { lat: 36.8065, lng: 10.1815 };

/** Tunisia bounding box, used to keep the map focused on the country. */
export const TUNISIA_BOUNDS: [[number, number], [number, number]] = [
  [30.2, 7.5], // south-west
  [37.6, 11.6], // north-east
];

export function isValidLatLng(value: Partial<LatLng> | null | undefined): value is LatLng {
  return (
    !!value &&
    typeof value.lat === 'number' &&
    typeof value.lng === 'number' &&
    Number.isFinite(value.lat) &&
    Number.isFinite(value.lng) &&
    Math.abs(value.lat) <= 90 &&
    Math.abs(value.lng) <= 180
  );
}

/** Haversine distance in km — used for sorting client-side previews. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Distance label.
 *
 * The U+2066 / U+2069 pair is a Unicode *isolate*: it tells the browser to lay
 * this run out left-to-right. Without it, an Arabic page renders "1.4 km" as
 * "km 1.4", which looks like a bug to every user.
 */
export function formatKm(km: number): string {
  const text = km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
  return `\u2066${text}\u2069`;
}

/**
 * Ask the browser for a position. Desktop browsers often refuse or return a
 * poor fix, which is exactly why the map also supports click + drag.
 */
export function getBrowserPosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.message || 'Location denied')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}

/** Free-text place search through Nominatim (OpenStreetMap, no API key). */
export async function searchPlaces(query: string): Promise<
  { label: string; lat: number; lng: number }[]
> {
  if (!query.trim()) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=tn&q=${encodeURIComponent(
    query,
  )}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as any[];
    return data.map((d) => ({
      label: d.display_name as string,
      lat: Number(d.lat),
      lng: Number(d.lon),
    }));
  } catch {
    // Offline or blocked: the caller simply shows no suggestions.
    return [];
  } finally {
    clearTimeout(timer);
  }
}
