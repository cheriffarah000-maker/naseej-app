import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ambulance,
  CheckCircle2,
  Crosshair,
  Loader2,
  MapPin,
  Siren,
  SlidersHorizontal,
} from 'lucide-react';
import clsx from 'clsx';
import MapView from '../components/MapView';
import BottomSheet from '../components/BottomSheet';
import { AppBar } from '../components/AppShell';
import { Button, Chip, EmptyState, Field, Input, Skeleton, Textarea, useToast } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { usePosition } from '../hooks/usePosition';
import { useI18n } from '../lib/i18n';
import { emergencyApi, errorKey } from '../lib/api';
import { formatKm } from '../lib/geo';
import type { HelpRequest, NearbyProvider } from '../lib/types';

export default function Emergency() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const { position, setPosition, locate, locating } = usePosition();

  const [radius, setRadius] = useState(12);
  const [providers, setProviders] = useState<NearbyProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [contactName, setContactName] = useState(user?.fullName ?? '');
  const [contactPhone, setContactPhone] = useState(user?.phone ?? '');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myRequests, setMyRequests] = useState<HelpRequest[]>([]);

  const selected = useMemo(
    () => providers.find((p) => p.id === selectedId) ?? null,
    [providers, selectedId],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const list = await emergencyApi.nearby(position.lat, position.lng, radius);
        if (!cancelled) {
          setProviders(list);
          setSelectedId((current) =>
            current && list.some((p) => p.id === current) ? current : (list[0]?.id ?? null),
          );
        }
      } catch {
        if (!cancelled) setProviders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [position.lat, position.lng, radius]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      try {
        const list = await emergencyApi.myRequests();
        if (!cancelled) setMyRequests(list.slice(0, 2));
      } catch {
        /* keep the screen usable */
      }
    };
    load();
    const interval = window.setInterval(load, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [user]);

  async function requestHelp() {
    if (!user) {
      navigate('/login', { state: { from: '/emergency' } });
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { request } = await emergencyApi.createRequest({
        lat: position.lat,
        lng: position.lng,
        note,
        contactName: contactName || user.fullName,
        contactPhone: contactPhone || user.phone,
      });
      toast.push(t('emergency.requestHelp'), 'success');
      navigate(`/emergency/request/${request.id}`);
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex h-full flex-col bg-bg">
      <div className="absolute inset-0">
        <MapView
          className="h-full w-full"
          center={position}
          zoom={12}
          me={position}
          onPick={(p) => setPosition(p)}
          providers={providers}
          selectedProviderId={selectedId}
          onSelectProvider={(p) => setSelectedId(p.id)}
          ariaLabel={t('emergency.title')}
        />
      </div>

      {/* Floating header over the map */}
      <div className="relative z-20">
        <div className="glass mx-3 mt-3 rounded-2xl">
          <AppBar title={t('emergency.title')} transparent onBack={() => navigate('/')} />
        </div>
      </div>

      {/* Floating controls */}
      <div className="pointer-events-none absolute inset-x-0 top-[74px] z-20 flex justify-between px-4">
        <button
          onClick={() => navigate('/sos')}
          className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-danger text-white shadow-float"
          aria-label={t('home.sosTitle')}
        >
          <Siren size={18} />
        </button>
        <button
          onClick={locate}
          disabled={locating}
          className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-surface text-brand shadow-float disabled:opacity-60"
          aria-label={t('emergency.useMyLocation')}
        >
          {locating ? <Loader2 size={17} className="animate-spin" /> : <Crosshair size={17} />}
        </button>
      </div>

      {/* Sheet */}
      <BottomSheet peekHeight={44} expandedHeight={84}>
        <div className="px-4 pb-3">
          <p className="mb-2.5 rounded-xl border border-danger/20 bg-danger/6 px-3 py-2 text-[10px] font-semibold leading-relaxed text-danger">
            {t('emergency.notice')}
          </p>

          <div className="mb-3 flex items-center gap-3">
            <SlidersHorizontal size={14} className="shrink-0 text-muted" />
            <input
              type="range"
              min={2}
              max={40}
              step={1}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              aria-label={t('emergency.radius')}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-line accent-brand"
            />
            {/* dir="ltr" so "12 km" is not reordered by the RTL paragraph */}
            <span dir="ltr" className="w-14 shrink-0 text-end text-[12px] font-bold text-brand">
              {radius} {t('common.km')}
            </span>
          </div>

          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[11px] font-extrabold uppercase tracking-wide text-muted">
              {t('emergency.results')}
            </h2>
            <span className="text-[11px] font-bold text-brand">{providers.length}</span>
          </div>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          ) : providers.length === 0 ? (
            <EmptyState
              icon={<MapPin size={18} />}
              title={t('emergency.noResults')}
              hint={t('emergency.noResultsHint')}
            />
          ) : (
            <div className="space-y-2">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => setSelectedId(provider.id)}
                  className={clsx(
                    'flex w-full items-center gap-3 rounded-2xl border p-2.5 text-start transition-colors',
                    provider.id === selectedId
                      ? 'border-brand bg-brand/8'
                      : 'border-line bg-surface',
                  )}
                >
                  <span
                    className={clsx(
                      'grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white',
                      provider.type === 'ambulance' ? 'bg-danger' : 'bg-gold',
                    )}
                  >
                    <Ambulance size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold text-ink">
                      {provider.name}
                    </span>
                    <span className="block truncate text-[11px] text-muted">
                      {t(`type.${provider.type}`)} · {provider.serviceArea || '—'}
                    </span>
                  </span>
                  <Chip tone={provider.type === 'ambulance' ? 'danger' : 'gold'}>
                    {formatKm(provider.distanceKm)}
                  </Chip>
                </button>
              ))}
            </div>
          )}

          {/* Request block */}
          <div className="mt-3 rounded-2xl border border-line bg-surface-2/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[12px] font-extrabold text-ink">{t('emergency.requestHelp')}</h2>
              {selected && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                  <CheckCircle2 size={11} /> {selected.name}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Field label={t('emergency.contactName')} htmlFor="req-name">
                  <Input
                    id="req-name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="h-10 text-[12.5px]"
                  />
                </Field>
                <Field label={t('emergency.contactPhone')} htmlFor="req-phone">
                  <Input
                    id="req-phone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+216…"
                    className="h-10 text-[12.5px]"
                  />
                </Field>
              </div>

              <Textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('emergency.notePlaceholder')}
                aria-label={t('emergency.note')}
                className="text-[12.5px]"
              />

              {error && (
                <p role="alert" className="text-[11px] font-semibold text-danger">
                  {error}
                </p>
              )}

              <Button
                variant="danger"
                fullWidth
                loading={submitting}
                onClick={requestHelp}
                icon={<Ambulance size={16} />}
              >
                {t('emergency.requestHelp')}
              </Button>
            </div>
          </div>

          {myRequests.length > 0 && (
            <div className="mt-3">
              <h2 className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-muted">
                {t('emergency.myRequests')}
              </h2>
              <div className="space-y-1.5">
                {myRequests.map((request) => (
                  <button
                    key={request.id}
                    onClick={() => navigate(`/emergency/request/${request.id}`)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-start"
                  >
                    <span className="truncate text-[11.5px] font-semibold text-ink">
                      {request.providerName ?? t('common.searching')}
                    </span>
                    <Chip tone={request.status === 'accepted' ? 'success' : 'warning'}>
                      {t(`status.${request.status}`)}
                    </Chip>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
