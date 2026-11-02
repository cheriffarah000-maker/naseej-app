import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { transportApi } from '../lib/api';
import type { Bus, BusStatus } from '../lib/types';

/**
 * Subscribes to one route and keeps the bus list live.
 *
 * WebSocket is the primary channel; the initial REST snapshot means the map is
 * correct even if the socket is still connecting (or blocked by a proxy).
 */
export function useLiveBuses(routeId?: string) {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!routeId) {
      setBuses([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    // 1. REST snapshot (also acts as a fallback if WebSocket is unavailable).
    transportApi
      .live(routeId)
      .then((list) => {
        if (!cancelled) setBuses(list);
      })
      .catch(() => {
        if (!cancelled) setBuses([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // 2. Socket for incremental updates.
    const socket = io({ path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('subscribe', { routeId });
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    socket.on('route:snapshot', (list: Bus[]) => {
      if (!cancelled && Array.isArray(list)) setBuses(list);
    });

    socket.on(
      'bus:location',
      (payload: { busId: string; lat: number; lng: number; ts: number }) => {
        if (cancelled) return;
        setBuses((prev) =>
          prev.map((bus) =>
            bus.id === payload.busId
              ? { ...bus, live: { lat: payload.lat, lng: payload.lng, ts: payload.ts } }
              : bus,
          ),
        );
      },
    );

    socket.on('bus:status', (payload: { busId: string; status: BusStatus }) => {
      if (cancelled) return;
      setBuses((prev) =>
        prev.map((bus) => (bus.id === payload.busId ? { ...bus, status: payload.status } : bus)),
      );
    });

    return () => {
      cancelled = true;
      socket.emit('unsubscribe', { routeId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [routeId]);

  return { buses, connected, loading, socket: socketRef };
}
