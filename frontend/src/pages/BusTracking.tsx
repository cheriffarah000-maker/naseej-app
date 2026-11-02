import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus as BusIcon, Loader2, Radio, Wifi, WifiOff } from 'lucide-react';
import clsx from 'clsx';
import MapView from '../components/MapView';
import BottomSheet from '../components/BottomSheet';
import { AppBar } from '../components/AppShell';
import { Button, Chip, EmptyState, Select, Skeleton, useToast } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../lib/i18n';
import { useLiveBuses } from '../hooks/useLiveBuses';
import { transportApi } from '../lib/api';
import { distanceKm, TUNIS } from '../lib/geo';
import type { Bus, BusRoute, BusStatus, LatLng, University } from '../lib/types';

const STATUS_TONE: Record<BusStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  on_the_way: 'success',
  full: 'warning',
  delayed: 'warning',
  not_running: 'neutral',
  canceled: 'danger',
};

export default function BusTracking() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();

  const [universities, setUniversities] = useState<University[]>([]);
  const [universityId, setUniversityId] = useState('');
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [routeId, setRouteId] = useState('');
  const [simulating, setSimulating] = useState(false);

  const { buses, connected, loading } = useLiveBuses(routeId || undefined);
  const route = useMemo(() => routes.find((r) => r.id === routeId) ?? null, [routes, routeId]);
  const canDrive = user?.role === 'driver' || user?.role === 'admin';

  useEffect(() => {
    transportApi
      .universities()
      .then((list) => {
        setUniversities(list);
        setUniversityId((current) => current || list[0]?.id || '');
      })
      .catch(() => setUniversities([]));
  }, []);

  useEffect(() => {
    if (!universityId) return;
    let cancelled = false;
    transportApi
      .routes(universityId)
      .then((list) => {
        if (cancelled) return;
        setRoutes(list);
        setRouteId(list[0]?.id ?? '');
      })
      .catch(() => {
        if (!cancelled) setRoutes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [universityId]);

  const center: LatLng = useMemo(() => {
    if (route?.stations?.length) return { lat: route.stations[0].lat, lng: route.stations[0].lng };
    const uni = universities.find((u) => u.id === universityId);
    return uni ? { lat: uni.lat, lng: uni.lng } : TUNIS;
  }, [route, universities, universityId]);

  /** Demo helper: nudges a bus toward its next station so the map moves. */
  function advanceBus(bus: Bus) {
    if (!route?.stations?.length) return;
    const current = bus.live ?? {
      lat: bus.currentLat ?? route.stations[0].lat,
      lng: bus.currentLng ?? route.stations[0].lng,
    };

    let nearest = 0;
    let best = Infinity;
    route.stations.forEach((station, index) => {
      const d = distanceKm(current, station);
      if (d < best) {
        best = d;
        nearest = index;
      }
    });

    const target = route.stations[(nearest + 1) % route.stations.length];
    transportApi
      .pushBusLocation(bus.id, current.lat + (target.lat - current.lat) * 0.35, current.lng + (target.lng - current.lng) * 0.35)
      .catch(() => {});
  }

  useEffect(() => {
    if (!simulating || !canDrive) return;
    const interval = window.setInterval(() => {
      const bus = buses.find((b) => b.live);
      if (bus) advanceBus(bus);
    }, 2200);
    return () => window.clearInterval(interval);
  }, [simulating, canDrive, buses, route]);

  async function changeStatus(bus: Bus, status: BusStatus) {
    try {
      await transportApi.setBusStatus(bus.id, status);
      toast.push(`${bus.plate}: ${t(`bus.status.${status}`)}`, 'success');
    } catch {
      toast.push(t('errors.generic'), 'error');
    }
  }

  return (
    <div className="relative flex h-full flex-col bg-bg">
      <div className="absolute inset-0">
        <MapView
          className="h-full w-full"
          center={center}
          zoom={13}
          route={route}
          buses={buses}
          draggableMe={false}
          ariaLabel={t('bus.title')}
        />
      </div>

      <div className="relative z-20">
        <div className="glass mx-3 mt-3 rounded-2xl">
          <AppBar
            title={t('bus.title')}
            subtitle={t('bus.subtitle')}
            transparent
            onBack={() => navigate('/')}
            action={
              <Chip tone={connected ? 'success' : 'neutral'} className="me-2 shrink-0">
                {connected ? <Wifi size={9} /> : <WifiOff size={9} />}
                {connected ? t('bus.connected') : t('bus.disconnected')}
              </Chip>
            }
          />
        </div>
      </div>

      <BottomSheet peekHeight={42} expandedHeight={82}>
        <div className="space-y-3 px-4 pb-3">
          {/* Stacked, not side by side: "Cité Universitaire - El Manar" cannot
              fit in a 175px native select and gets clipped. */}
          <div className="space-y-2">
            <div>
              <label htmlFor="uni" className="mb-1 block text-[10.5px] font-bold text-muted">
                {t('bus.chooseUniversity')}
              </label>
              <Select
                id="uni"
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
                className="h-10 text-[12px]"
              >
                {universities.length === 0 && <option value="">—</option>}
                {universities.map((uni) => (
                  <option key={uni.id} value={uni.id}>
                    {/* "Université de Tunis El Manar" -> "Tunis El Manar",
                        because two cities share the name "Tunis". */}
                    {uni.name.replace(/^Université (de |d')?/i, '')}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="route" className="mb-1 block text-[10.5px] font-bold text-muted">
                {t('bus.chooseRoute')}
              </label>
              <Select
                id="route"
                value={routeId}
                onChange={(e) => setRouteId(e.target.value)}
                disabled={routes.length === 0}
                className="h-10 text-[12px]"
              >
                {routes.length === 0 && <option value="">—</option>}
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <h2 className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold text-muted">
              <Radio size={11} /> {t('bus.buses')}
            </h2>

            {loading ? (
              <Skeleton className="h-16 w-full rounded-2xl" />
            ) : buses.length === 0 ? (
              <EmptyState
                icon={<BusIcon size={18} />}
                title={t('bus.noBuses')}
                hint={t('bus.noBusesHint')}
              />
            ) : (
              <div className="space-y-2">
                {buses.map((bus) => (
                  <div key={bus.id} className="rounded-2xl border border-line bg-surface p-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/20 text-deep">
                        <BusIcon size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-ink">{bus.plate}</p>
                        <p className="text-[10.5px] text-muted">
                          {bus.capacity} {t('admin.capacity')}
                        </p>
                      </div>
                      <Chip tone={STATUS_TONE[bus.status]}>{t(`bus.status.${bus.status}`)}</Chip>
                    </div>

                    {canDrive && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {(['on_the_way', 'full', 'delayed', 'not_running', 'canceled'] as BusStatus[]).map(
                          (status) => (
                            <button
                              key={status}
                              onClick={() => changeStatus(bus, status)}
                              className={clsx(
                                'rounded-lg border px-1.5 py-1 text-[9px] font-bold transition-colors',
                                bus.status === status
                                  ? 'border-brand bg-brand text-white'
                                  : 'border-line text-muted',
                              )}
                            >
                              {t(`bus.status.${status}`)}
                            </button>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {canDrive && buses.length > 0 && (
              <Button
                variant={simulating ? 'danger' : 'outline'}
                size="sm"
                fullWidth
                className="mt-2"
                onClick={() => setSimulating((s) => !s)}
                icon={simulating ? <Loader2 size={13} className="animate-spin" /> : undefined}
              >
                {simulating ? t('common.cancel') : t('bus.simulate')}
              </Button>
            )}
          </div>

          {route?.stations?.length ? (
            <div>
              <h2 className="mb-2 text-[11px] font-extrabold text-muted">
                {t('bus.stations')}
              </h2>
              <ol className="relative space-y-2.5 ps-4">
                <span className="absolute bottom-2 start-[4px] top-2 w-px bg-line" />
                {route.stations.map((station, index) => (
                  <li key={`${station.name}-${index}`} className="relative">
                    <span className="absolute -start-4 top-1 grid h-2.5 w-2.5 place-items-center rounded-full border-2 border-brand bg-surface" />
                    <p className="text-[12px] font-semibold text-ink">{station.name}</p>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      </BottomSheet>
    </div>
  );
}
