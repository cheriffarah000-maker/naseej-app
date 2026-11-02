import React, { useState } from 'react';
import { Crosshair, Loader2, MapPin, Search } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { searchPlaces } from '../lib/geo';
import type { LatLng } from '../lib/types';

/**
 * Search + geolocation. Always paired with "click the map to move the pin",
 * because a desktop browser is a poor GPS.
 */
export default function PositionControls({
  onPick,
  onLocate,
  locating,
  hint,
}: {
  onPick: (p: LatLng) => void;
  onLocate: () => void;
  locating?: boolean;
  hint?: string;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ label: string; lat: number; lng: number }[]>([]);
  const [searching, setSearching] = useState(false);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    try {
      setResults(await searchPlaces(query));
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <form onSubmit={runSearch} className="relative flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('nav.emergency') + ' · Tunis'}
            aria-label={t('common.language')}
            className="h-11 w-full rounded-xl border border-line bg-surface ps-9 pe-3 text-[13px] text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
          />
          {searching && (
            <Loader2
              size={14}
              className="absolute end-3 top-1/2 -translate-y-1/2 animate-spin text-brand"
            />
          )}
        </form>

        <button
          type="button"
          onClick={onLocate}
          disabled={locating}
          aria-label={t('emergency.useMyLocation')}
          title={t('emergency.useMyLocation')}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-surface text-brand transition-colors hover:bg-brand/8 disabled:opacity-60"
        >
          {locating ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
        </button>
      </div>

      {results.length > 0 && (
        <ul className="overflow-hidden rounded-xl border border-line bg-surface shadow-soft">
          {results.map((r, i) => (
            <li key={`${r.label}-${i}`}>
              <button
                type="button"
                onClick={() => {
                  onPick({ lat: r.lat, lng: r.lng });
                  setResults([]);
                  setQuery('');
                }}
                className="flex w-full items-start gap-2 px-3 py-2 text-start text-[12px] leading-snug text-ink hover:bg-surface-2"
              >
                <MapPin size={13} className="mt-0.5 shrink-0 text-brand" />
                <span className="line-clamp-2">{r.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {hint && <p className="text-[11px] leading-relaxed text-muted">{hint}</p>}
    </div>
  );
}
