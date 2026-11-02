import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bus,
  ChevronRight,
  MapPin,
  Moon,
  PhoneCall,
  ShieldAlert,
  Sun,
  Ambulance,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePosition } from '../hooks/usePosition';
import { useI18n } from '../lib/i18n';
import { emergencyApi } from '../lib/api';
import { formatKm } from '../lib/geo';
import { Chip, Skeleton } from '../components/ui';
import type { NearbyProvider } from '../lib/types';

/**
 * The screen after login: two big doors (transport / ambulance) plus the SOS
 * card. Everything else on this screen is secondary to these three actions.
 */
export default function Home() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const { t, lang, setLang, dir } = useI18n();
  const navigate = useNavigate();
  const { position } = usePosition();

  const [providers, setProviders] = useState<NearbyProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const list = await emergencyApi.nearby(position.lat, position.lng, 15);
        if (!cancelled) setProviders(list);
      } catch {
        if (!cancelled) setProviders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [position.lat, position.lng]);

  const firstName = user?.fullName?.split(' ')[0] ?? '';

  return (
    <div className="flex h-full flex-col bg-bg">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pb-3 pt-4">
        <div className="grid h-11 w-11 place-items-center rounded-arch bg-deep text-[15px] font-black text-white">
          {(firstName || t('app.name')).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-muted">{t('dashboard.greeting')}</p>
          <p className="truncate text-[16px] font-extrabold leading-tight text-ink">{firstName}</p>
        </div>

        <button
          onClick={() => setLang(lang === 'ar' ? 'fr' : lang === 'fr' ? 'en' : 'ar')}
          aria-label={t('common.language')}
          className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-[10px] font-black uppercase text-ink"
        >
          {lang}
        </button>
        <button
          onClick={toggle}
          aria-label={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
          className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-ink"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-6 scroll-thin">
        {/* SOS — always the most visible element on the screen */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => navigate('/sos')}
          className="relative w-full overflow-hidden rounded-[22px] p-4 text-start text-white shadow-float"
          style={{ background: 'linear-gradient(135deg, #e1001a 0%, #a8000f 100%)' }}
        >
          <div className="zellige absolute inset-0 opacity-40" />
          <div className="relative flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20">
              <ShieldAlert size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-extrabold leading-tight">{t('home.sosTitle')}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-white/80">{t('home.sosSub')}</p>
            </div>
          </div>

          <div className="relative mt-3 flex gap-2">
            <a
              href="tel:190"
              onClick={(e) => e.stopPropagation()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/95 py-2 text-[12px] font-extrabold text-danger"
            >
              <PhoneCall size={13} /> 190
            </a>
            {/* Both numbers get the same visual weight: they are equally
                critical, and a translucent button reads as "disabled". */}
            <a
              href="tel:198"
              onClick={(e) => e.stopPropagation()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/95 py-2 text-[12px] font-extrabold text-danger"
            >
              <PhoneCall size={13} /> 198
            </a>
          </div>
        </motion.button>

        {/* The two doors */}
        <div>
          <h2 className="mb-2 px-1 text-[12px] font-extrabold uppercase tracking-[0.08em] text-muted">
            {t('home.need')}
          </h2>

          <div className="space-y-2.5">
            <Door
              tone="transport"
              icon={<Bus size={22} />}
              title={t('home.transport')}
              subtitle={t('home.transportSub')}
              onClick={() => navigate('/bus')}
            />
            <Door
              tone="emergency"
              icon={<Ambulance size={22} />}
              title={t('home.emergency')}
              subtitle={t('home.emergencySub')}
              onClick={() => navigate('/emergency')}
            />
          </div>
        </div>

        {/* Nearby helpers — proof the network is alive */}
        <div>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-muted">
              {t('dashboard.nearby')}
            </h2>
            <button
              onClick={() => navigate('/emergency')}
              className="inline-flex items-center gap-0.5 text-[11px] font-bold text-brand"
            >
              {t('common.retry') === 'Retry' ? 'All' : t('emergency.findNearby')}
              <ArrowRight size={11} className={clsx(dir === 'rtl' && 'rotate-180')} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          ) : providers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line px-4 py-5 text-center">
              <MapPin size={18} className="mx-auto mb-1.5 text-muted" />
              <p className="text-[12px] font-bold text-ink">{t('emergency.noResults')}</p>
              <p className="mt-0.5 text-[11px] text-muted">{t('emergency.noResultsHint')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {providers.slice(0, 5).map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => navigate('/emergency')}
                  className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-2.5 text-start transition-colors hover:border-brand/40"
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
                      {t(`type.${provider.type}`)} · {provider.serviceArea || 'Tunis'}
                    </span>
                  </span>
                  <Chip tone={provider.type === 'ambulance' ? 'danger' : 'gold'}>
                    {formatKm(provider.distanceKm)}
                  </Chip>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Closes the screen instead of leaving a dead gap above the tab bar. */}
        <p className="rounded-xl border border-line/70 bg-surface/60 px-3 py-2.5 text-center text-[10px] leading-relaxed text-muted">
          {t('emergency.notice')}
        </p>
      </div>
    </div>
  );
}

/** One of the two big choices. Colour carries the meaning, not just decoration. */
function Door({
  tone,
  icon,
  title,
  subtitle,
  onClick,
}: {
  tone: 'transport' | 'emergency';
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  const isTransport = tone === 'transport';

  return (
    <button
      onClick={onClick}
      className={clsx(
        'group flex w-full items-center gap-3.5 rounded-[22px] border p-3.5 text-start transition-transform active:scale-[0.985]',
        isTransport ? 'border-brand/25 bg-brand/6' : 'border-gold/30 bg-gold/8',
      )}
    >
      <span
        className={clsx(
          'grid h-12 w-12 shrink-0 place-items-center rounded-arch text-white shadow-soft',
          isTransport ? 'bg-brand' : 'bg-deep',
        )}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-extrabold leading-tight text-ink">{title}</span>
        <span className="mt-0.5 block truncate text-[11.5px] text-muted">{subtitle}</span>
      </span>

      <ChevronRight
        size={18}
        className={clsx('shrink-0 text-muted transition-transform group-hover:translate-x-0.5', 'rtl:rotate-180 rtl:group-hover:-translate-x-0.5')}
      />
    </button>
  );
}
