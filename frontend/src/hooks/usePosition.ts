import { useCallback, useState } from 'react';
import { authApi } from '../lib/api';
import { getBrowserPosition, isValidLatLng, TUNIS } from '../lib/geo';
import { useAuth } from '../context/AuthContext';
import type { LatLng } from '../lib/types';

/**
 * One source of truth for "where am I?".
 *
 * Desktop browsers have weak GPS, so the map can always override this value by
 * clicking or dragging the pin — that is a feature, not a fallback.
 */
export function usePosition() {
  const { user, setUser } = useAuth();

  const [position, setPositionState] = useState<LatLng>(() => {
    if (user && isValidLatLng({ lat: user.lastLat as number, lng: user.lastLng as number })) {
      return { lat: user.lastLat as number, lng: user.lastLng as number };
    }
    return TUNIS;
  });

  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  /**
   * Persist only when the user consented. Without consent we still use the
   * point for the current search, but nothing is written to the database.
   */
  const setPosition = useCallback(
    async (next: LatLng, persist = true) => {
      setPositionState(next);
      if (!persist || !user || !user.locationConsent) return;

      try {
        const updated = await authApi.saveLocation(next.lat, next.lng, true);
        setUser(updated);
      } catch {
        // Saving is best-effort: the search still works with the local value.
      }
    },
    [user, setUser],
  );

  const locate = useCallback(async () => {
    setLocating(true);
    setLocateError(null);
    try {
      const p = await getBrowserPosition();
      await setPosition(p, true);
      return p;
    } catch (err) {
      setLocateError((err as Error).message);
      return null;
    } finally {
      setLocating(false);
    }
  }, [setPosition]);

  return { position, setPosition, locate, locating, locateError };
}
