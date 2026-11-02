import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ambulance, ArrowUpRight, Bus, Clock3, MapPin, Sparkles } from 'lucide-react';
import MapView from '../components/MapView';
import PositionControls from '../components/PositionControls';
import ProviderCard from '../components/ProviderCard';
import { ArchIcon, Button, Chip, EmptyState, GlassPanel, Skeleton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { usePosition } from '../hooks/usePosition';
import { useI18n } from '../lib/i18n';
import { emergencyApi } from '../lib/api';
import type { HelpRequest, NearbyProvider } from '../lib/types';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { position, setPosition, locate, locating } = usePosition();

  const [providers, setProviders] = useState<NearbyProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [activeRequest, setActiveRequest] = useState<HelpRequest | null>(null);

  // Debounced search: the user can drag the pin without hammering the API.
  useEffect(() => {
    let cancelled = false;
    setLoadingProviders(true);

    const timer = window.setTimeout(async () => {
      try {
        const list = await emergencyApi.nearby(position.lat, position.lng, 12);
        if (!cancelled) setProviders(list);
      } catch {
        if (!cancelled) setProviders([]);
      } finally {
        if (!cancelled) setLoadingProviders(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [position.lat, position.lng]);

  // Any request still waiting or accepted is shown at the top of the panel.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      try {
        const list = await emergencyApi.myRequests();
        if (!cancelled) {
          setActiveRequest(list.find((r) => r.status === 'pending' || r.status === 'accepted') ?? null);
        }
      } catch {
        /* silent: dashboard must still render */
      }
    };

    load();
    const interval = window.setInterval(load, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [user]);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <MapView
        className="absolute inset-0"
        center={position}
        zoom={12}
        me={position}
        onPick={(p) => setPosition(p)}
        providers={providers}
        onSelectProvider={(p) => navigate('/emergency', { state: { focus: p.id } })}
        ariaLabel={t('emergency.yourPosition')}
      />

      {/* Floating panel over the map */}
      <GlassPanel className="absolute bottom-24 start-4 top-4 flex w-[336px] flex-col overflow-hidden max-lg:bottom-4">
        <div className="border-b border-line/60 px-4 pb-3 pt-4">
          <div className="flex items-center gap-2.5">
            <ArchIcon tone="deep" size={34}>
              <span className="text-[13px] font-black">
                {user ? user.fullName.trim().charAt(0).toUpperCase() : 'ن'}
              </span>
            </ArchIcon>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-extrabold text-ink">
                {user ? `${t('dashboard.greeting')}, ${user.fullName.split(' ')[0]}` : t('app.name')}
              </p>
              <p className="truncate text-[11px] text-muted">
                {user ? t(`role.${user.role}`) : t('app.tagline')}
              </p>
            </div>
          </div>

          <div className="mt-3">
            <PositionControls
              onPick={(p) => setPosition(p)}
              onLocate={locate}
              locating={locating}
              hint={t('emergency.clickMap')}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 scroll-thin">
          {activeRequest && (
            <Link
              to={`/emergency/request/${activeRequest.id}`}
              className="mb-3 block rounded-xl border border-brand/30 bg-brand/8 p-3 transition-colors hover:bg-brand/12"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wide text-brand">
                  {t('dashboard.activeRequest')}
                </span>
                <Chip tone={activeRequest.status === 'accepted' ? 'success' : 'warning'}>
                  {t(`status.${activeRequest.status}`)}
                </Chip>
              </div>
              <p className="mt-1 truncate text-[13px] font-bold text-ink">
                {activeRequest.providerName ?? t('common.searching')}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                <Clock3 size={11} />
                {new Date(activeRequest.createdAt).toLocaleTimeString()}
              </p>
            </Link>
          )}

          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[12px] font-extrabold uppercase tracking-wide text-muted">
              {t('dashboard.nearby')}
            </h2>
            <Link
              to="/emergency"
              className="inline-flex items-center gap-0.5 text-[11px] font-bold text-brand"
            >
              {t('emergency.findNearby')} <ArrowUpRight size={12} />
            </Link>
          </div>

          {loadingProviders ? (
            <div className="space-y-2">
              <Skeleton className="h-[62px] w-full" />
              <Skeleton className="h-[62px] w-full" />
              <Skeleton className="h-[62px] w-full" />
            </div>
          ) : providers.length === 0 ? (
            <EmptyState
              icon={<MapPin size={20} />}
              title={t('emergency.noResults')}
              hint={t('emergency.noResultsHint')}
            />
          ) : (
            <div className="space-y-2">
              {providers.slice(0, 4).map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          )}

          <div className="mt-4">
            <h2 className="mb-2 text-[12px] font-extrabold uppercase tracking-wide text-muted">
              {t('dashboard.quickActions')}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate('/emergency')}
                className="group rounded-xl border border-line bg-surface p-3 text-start transition-all hover:border-danger/40 hover:bg-danger/5"
              >
                <Ambulance size={18} className="mb-2 text-danger" />
                <p className="text-[12px] font-bold text-ink">{t('dashboard.findHelp')}</p>
              </button>
              <button
                onClick={() => navigate('/bus')}
                className="group rounded-xl border border-line bg-surface p-3 text-start transition-all hover:border-brand/40 hover:bg-brand/5"
              >
                <Bus size={18} className="mb-2 text-brand" />
                <p className="text-[12px] font-bold text-ink">{t('dashboard.trackBus')}</p>
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-line/60 bg-danger/6 px-4 py-2.5">
          <p className="text-[10px] font-semibold leading-relaxed text-danger">
            {t('emergency.notice')}
          </p>
        </div>
      </GlassPanel>

      {/* Bottom-right context card (in LTR). Hidden on small screens. */}
      <div className="glass absolute bottom-24 end-4 hidden items-center gap-3 rounded-2xl px-4 py-3 shadow-float md:flex">
        <Sparkles size={16} className="text-gold" />
        <div>
          <p className="text-[11px] font-bold text-ink">{t('app.name')} · Tunisie</p>
          <p className="text-[10px] text-muted">
            {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
          </p>
        </div>
      </div>
    </div>
  );
}
