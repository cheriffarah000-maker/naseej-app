import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Bus, Home, Cross, UserRound } from 'lucide-react';
import clsx from 'clsx';
import { useI18n } from '../lib/i18n';

/**
 * The phone frame every screen lives in.
 *
 * On a phone: full screen. On desktop: a 430px device shell, which is how a
 * mobile app should be reviewed. This is also what makes the whole product
 * feel like an app instead of a website.
 */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-stage">
      <div className="app-frame">{children}</div>
    </div>
  );
}

const TABS = [
  { to: '/', key: 'nav.home', icon: Home },
  // A plain medical cross stays legible at 20px; the ambulance van turns to mush.
  { to: '/emergency', key: 'nav.emergency', icon: Cross },
  { to: '/bus', key: 'nav.bus', icon: Bus },
  { to: '/profile', key: 'nav.profile', icon: UserRound },
];

export function TabBar() {
  const { t } = useI18n();
  const location = useLocation();

  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map(({ to, key, icon: Icon }) => {
        const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
        return (
          <NavLink key={to} to={to} className="tab" data-active={active}>
            <span className="tab__icon">
              <Icon size={20} strokeWidth={active ? 2.4 : 1.9} />
            </span>
            {t(key)}
          </NavLink>
        );
      })}
    </nav>
  );
}

/** A compact top bar for inner screens (back arrow + title + action slot). */
export function AppBar({
  title,
  subtitle,
  onBack,
  action,
  transparent,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: React.ReactNode;
  transparent?: boolean;
}) {
  return (
    <header
      className={clsx(
        'relative z-20 flex items-center gap-2 px-3 py-2.5',
        transparent ? '' : 'border-b border-line bg-surface',
      )}
    >
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Back"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-surface-2"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[15px] font-extrabold leading-tight text-ink">{title}</h1>
        {subtitle && <p className="truncate text-[11px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
