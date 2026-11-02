import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { TUNIS, TUNISIA_BOUNDS } from '../lib/geo';
import { useTheme } from '../context/ThemeContext';
import type { Bus, BusRoute, LatLng, NearbyProvider } from '../lib/types';

/**
 * Basemaps that need NO API key and NO billing account.
 *
 *   light -> Esri World Street Map   (street-level, Arabic + French labels)
 *   dark  -> Esri Dark Gray Canvas   (a real dark map, not an inverted one)
 *   fallback -> OpenStreetMap        (used automatically if Esri ever fails)
 *
 * Why Esri rather than Google Maps: Google requires a billing-enabled API key,
 * and a key checked into a student repo is a leak. CARTO was the first choice,
 * but their public tiles now come back stamped "API KEY REQUIRED" — which is
 * exactly the blank-map bug we are avoiding. Both Esri endpoints below were
 * verified to return real Tunis tiles.
 */
const TILES = {
  light: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; <a href="https://www.esri.com">Esri</a> — Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
  },
  dark: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; <a href="https://www.esri.com">Esri</a> — Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
  },
  fallback: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
};

/* -------------------------------------------------------------------------- */
/* Markers                                                                    */
/* -------------------------------------------------------------------------- */
const pin = (variant: string, glyph: string, selected = false, size = 32) =>
  L.divIcon({
    className: '',
    html: `<div class="map-pin map-pin--${variant}${selected ? ' map-pin--selected' : ''}" style="width:${size}px;height:${size}px"><span style="font-size:${size * 0.44}px">${glyph}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    tooltipAnchor: [0, -size + 4],
  });

function useIcons(selectedProviderId?: string | null) {
  return useMemo(
    () => ({
      me: pin('me', '●', false, 26),
      ambulance: (id: string) => pin('ambulance', '✚', id === selectedProviderId, 34),
      volunteer: (id: string) => pin('volunteer', '✚', id === selectedProviderId, 34),
      // Drawn as SVG rather than the 🚌 emoji: emoji fonts are missing on many
      // Linux/Windows setups and the glyph degrades into an empty box.
      bus: L.divIcon({
        className: '',
        html: `<div class="map-pin map-pin--bus" style="width:32px;height:32px"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#23303b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="13" rx="2.5"/><path d="M5 11h14"/><path d="M9 4v7M15 4v7"/><circle cx="9" cy="20" r="1.4" fill="#23303b"/><circle cx="15" cy="20" r="1.4" fill="#23303b"/></svg></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        tooltipAnchor: [0, -28],
      }),
      station: (color: string) =>
        L.divIcon({
          className: '',
          html: `<div style="width:12px;height:12px;border-radius:50%;background:#fff;border:3px solid ${color};box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        }),
    }),
    [selectedProviderId],
  );
}

/* -------------------------------------------------------------------------- */
/* Map behaviours                                                             */
/* -------------------------------------------------------------------------- */
function ClickCatcher({ onPick }: { onPick?: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function Camera({
  center,
  zoom,
  bounds,
}: {
  center?: LatLng;
  zoom?: number;
  bounds?: [[number, number], [number, number]] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
  }, [bounds?.[0]?.[0], bounds?.[0]?.[1], bounds?.[1]?.[0], bounds?.[1]?.[1]]);

  useEffect(() => {
    if (center) map.flyTo([center.lat, center.lng], zoom ?? map.getZoom(), { duration: 0.8 });
  }, [center?.lat, center?.lng, zoom]);

  // Leaflet measures its container once; the bottom sheet changes that size.
  useEffect(() => {
    const invalidate = () => map.invalidateSize();
    const timer = window.setTimeout(invalidate, 320);
    window.addEventListener('resize', invalidate);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', invalidate);
    };
  }, [map]);

  return null;
}

/** Interpolates between GPS points so a bus glides instead of teleporting. */
function SmoothBusMarker({ bus }: { bus: Bus & { live: { lat: number; lng: number } } }) {
  const icons = useIcons();
  const [pos, setPos] = useState<[number, number]>([bus.live.lat, bus.live.lng]);
  const fromRef = useRef<[number, number]>([bus.live.lat, bus.live.lng]);
  const rafRef = useRef<number>();

  useEffect(() => {
    const from = fromRef.current;
    const to: [number, number] = [bus.live.lat, bus.live.lng];
    if (from[0] === to[0] && from[1] === to[1]) return;

    const start = performance.now();
    const duration = 900;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      const next: [number, number] = [
        from[0] + (to[0] - from[0]) * eased,
        from[1] + (to[1] - from[1]) * eased,
      ];
      setPos(next);
      fromRef.current = next;
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [bus.live.lat, bus.live.lng]);

  return (
    <Marker position={pos} icon={icons.bus} keyboard={false}>
      <Tooltip direction="top">{bus.plate}</Tooltip>
    </Marker>
  );
}

/* -------------------------------------------------------------------------- */
/* Public component                                                           */
/* -------------------------------------------------------------------------- */
export interface MapViewProps {
  center?: LatLng;
  zoom?: number;
  me?: LatLng | null;
  onPick?: (p: LatLng) => void;
  draggableMe?: boolean;
  providers?: NearbyProvider[];
  onSelectProvider?: (p: NearbyProvider) => void;
  selectedProviderId?: string | null;
  buses?: (Bus & { live?: { lat: number; lng: number } | null })[];
  route?: BusRoute | null;
  bounds?: [[number, number], [number, number]] | null;
  className?: string;
  ariaLabel?: string;
  zoomControl?: boolean;
}

export default function MapView({
  center = TUNIS,
  zoom = 12,
  me,
  onPick,
  draggableMe = true,
  providers = [],
  onSelectProvider,
  selectedProviderId,
  buses = [],
  route,
  bounds = null,
  className,
  ariaLabel = 'Map',
  zoomControl = false,
}: MapViewProps) {
  const { theme } = useTheme();
  const icons = useIcons(selectedProviderId);
  const tiles = theme === 'dark' ? TILES.dark : TILES.light;

  // If the primary tiles ever stop serving images, drop to OpenStreetMap
  // instead of showing the user a grey rectangle.
  const [useFallback, setUseFallback] = useState(false);

  const routeLine = useMemo(
    () => (route?.stations ?? []).map((s) => [s.lat, s.lng] as [number, number]),
    [route],
  );

  return (
    <div className={className} role="application" aria-label={ariaLabel}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        minZoom={6}
        maxBounds={TUNISIA_BOUNDS}
        maxBoundsViscosity={0.5}
        zoomControl={zoomControl}
        scrollWheelZoom
        className="h-full w-full"
      >
        {/* key forces a clean tile swap when the theme or source changes */}
        <TileLayer
          key={`${theme}-${useFallback}`}
          url={useFallback ? TILES.fallback.url : tiles.url}
          attribution={useFallback ? TILES.fallback.attribution : tiles.attribution}
          maxZoom={19}
          eventHandlers={{
            tileerror: () => {
              if (!useFallback) setUseFallback(true);
            },
          }}
        />

        <Camera center={center} zoom={zoom} bounds={bounds} />
        <ClickCatcher onPick={onPick} />

        {routeLine.length > 1 && (
          <Polyline
            positions={routeLine}
            pathOptions={{ color: route?.color || '#0063d6', weight: 4, opacity: 0.9 }}
          />
        )}

        {route?.stations?.map((station, index) => (
          <Marker
            key={`${station.name}-${index}`}
            position={[station.lat, station.lng]}
            icon={icons.station(route?.color || '#0063d6')}
          >
            <Tooltip direction="top">{station.name}</Tooltip>
          </Marker>
        ))}

        {providers.map((provider) => (
          <Marker
            key={provider.id}
            position={[provider.lat, provider.lng]}
            icon={
              provider.type === 'ambulance'
                ? icons.ambulance(provider.id)
                : icons.volunteer(provider.id)
            }
            eventHandlers={{ click: () => onSelectProvider?.(provider) }}
          >
            <Tooltip direction="top">
              {provider.name} · {provider.distanceKm} km
            </Tooltip>
          </Marker>
        ))}

        {buses
          .filter((bus) => bus.live)
          .map((bus) => (
            <SmoothBusMarker key={bus.id} bus={bus as any} />
          ))}

        {me && (
          <Marker
            position={[me.lat, me.lng]}
            icon={icons.me}
            draggable={draggableMe}
            eventHandlers={{
              dragend: (e) => {
                const p = (e.target as L.Marker).getLatLng();
                onPick?.({ lat: p.lat, lng: p.lng });
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
