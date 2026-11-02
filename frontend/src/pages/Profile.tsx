import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  Globe,
  LogOut,
  MapPin,
  Moon,
  Phone,
  Settings,
  ShieldCheck,
  Sun,
  UserRound,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePosition } from '../hooks/usePosition';
import { useI18n, type Lang } from '../lib/i18n';
import { authApi, errorKey } from '../lib/api';
import { Chip, Switch, useToast } from '../components/ui';
import type { User } from '../lib/types';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { t, lang, setLang, languages } = useI18n();
  const { position } = usePosition();
  const toast = useToast();
  const navigate = useNavigate();

  const [consentBusy, setConsentBusy] = useState(false);

  if (!user) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <UserRound size={26} className="text-muted" />
        <p className="text-[13px] font-bold text-ink">{t('auth.login.title')}</p>
        <button
          onClick={() => navigate('/login')}
          className="rounded-xl bg-brand px-4 py-2 text-[12px] font-bold text-white"
        >
          {t('nav.login')}
        </button>
      </div>
    );
  }

  /**
   * Consent is a real privacy switch, not a label: turning it off deletes the
   * stored coordinates in the same request.
   */
  async function toggleConsent(next: boolean) {
    setConsentBusy(true);
    try {
      const updated: User = await authApi.saveLocation(position.lat, position.lng, next);
      setUser(updated);
      toast.push(next ? t('profile.consentOn') : t('profile.consentOff'), 'success');
    } catch (err) {
      toast.push(t(errorKey(err)), 'error');
    } finally {
      setConsentBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-bg">
      <header className="border-b border-line bg-surface px-5 pb-4 pt-5">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-arch bg-deep text-[20px] font-black text-white">
            {user.fullName.trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-extrabold leading-tight text-ink">
              {user.fullName}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <Chip tone="info">{t(`role.${user.role}`)}</Chip>
              {user.locationConsent && (
                <Chip tone="success">
                  <ShieldCheck size={9} /> GPS
                </Chip>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-1.5 text-[11.5px] text-muted">
          <p className="flex items-center gap-1.5">
            <Phone size={11} /> {user.phone}
          </p>
          <p className="flex items-center gap-1.5 truncate">
            <BadgeCheck size={11} /> {user.email}
          </p>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 scroll-thin">
        {/* Language */}
        <section>
          <h2 className="mb-1.5 px-1 text-[11px] font-extrabold uppercase tracking-wide text-muted">
            {t('common.language')}
          </h2>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {languages.map((item) => (
              <button
                key={item.id}
                onClick={() => setLang(item.id as Lang)}
                className={clsx(
                  'flex w-full items-center gap-2.5 px-3.5 py-3 text-start text-[13px] font-semibold',
                  item.id === lang ? 'text-brand' : 'text-ink',
                )}
              >
                <Globe size={15} className="text-muted" />
                <span className="flex-1">{item.label}</span>
                {item.id === lang && <span className="text-[15px]">✓</span>}
              </button>
            ))}
          </div>
        </section>

        {/* Appearance */}
        <section>
          <h2 className="mb-1.5 px-1 text-[11px] font-extrabold uppercase tracking-wide text-muted">
            {theme === 'dark' ? t('common.darkMode') : t('common.lightMode')}
          </h2>
          <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-surface px-3.5 py-3">
            {theme === 'dark' ? <Moon size={15} className="text-muted" /> : <Sun size={15} className="text-muted" />}
            <span className="flex-1 text-[13px] font-semibold text-ink">
              {theme === 'dark' ? t('common.darkMode') : t('common.lightMode')}
            </span>
            <Switch checked={theme === 'dark'} onChange={toggle} label={t('common.darkMode')} />
          </div>
        </section>

        {/* Position + consent */}
        <section>
          <h2 className="mb-1.5 px-1 text-[11px] font-extrabold uppercase tracking-wide text-muted">
            {t('profile.location')}
          </h2>
          <div className="rounded-2xl border border-line bg-surface px-3.5 py-3">
            <div className="flex items-center gap-2 text-[11.5px] text-muted">
              <MapPin size={13} className="text-brand" />
              {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
            </div>
            <div className="mt-3 flex items-center gap-2.5 border-t border-line pt-3">
              <span className="flex-1 text-[12.5px] font-semibold leading-snug text-ink">
                {t('profile.consent')}
              </span>
              <Switch
                checked={user.locationConsent}
                onChange={toggleConsent}
                label={t('profile.consent')}
              />
            </div>
            <p className="mt-2 text-[10.5px] leading-relaxed text-muted">
              {t('emergency.consentHint')}
            </p>
            {consentBusy && <p className="mt-1 text-[10px] text-brand">{t('common.loading')}</p>}
          </div>
        </section>

        {/* Role-specific shortcuts */}
        {(user.role === 'provider' || user.role === 'volunteer' || user.role === 'admin') && (
          <section>
            <button
              onClick={() => navigate('/provider')}
              className="flex w-full items-center gap-2.5 rounded-2xl border border-line bg-surface px-3.5 py-3 text-start"
            >
              <Settings size={15} className="text-muted" />
              <span className="flex-1 text-[13px] font-semibold text-ink">{t('provider.title')}</span>
              <span className="text-[15px] text-muted rtl:rotate-180">›</span>
            </button>
          </section>
        )}

        {user.role === 'admin' && (
          <button
            onClick={() => navigate('/admin')}
            className="flex w-full items-center gap-2.5 rounded-2xl border border-line bg-surface px-3.5 py-3 text-start"
          >
            <Settings size={15} className="text-muted" />
            <span className="flex-1 text-[13px] font-semibold text-ink">{t('admin.title')}</span>
            <span className="text-[15px] text-muted rtl:rotate-180">›</span>
          </button>
        )}

        <button
          onClick={() => {
            logout();
            navigate('/welcome', { replace: true });
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-danger/25 bg-danger/6 py-3 text-[12.5px] font-bold text-danger"
        >
          <LogOut size={14} /> {t('profile.signOut')}
        </button>

        <p className="pb-2 text-center text-[10px] leading-relaxed text-muted">
          {t('app.name')} · {t('welcome.kicker')} · v2
        </p>
      </div>
    </div>
  );
}
