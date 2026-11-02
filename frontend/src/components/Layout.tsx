import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Ambulance,
  Bus,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Phone,
  Settings,
  ShieldAlert,
  Sun,
  UserRound,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n, type Lang } from '../lib/i18n';
import { ArchIcon, Button, Modal } from './ui';
import type { Role } from '../lib/types';

const NAV: { to: string; key: string; icon: React.ReactNode; roles?: Role[] }[] = [
  { to: '/', key: 'nav.home', icon: <LayoutDashboard size={18} /> },
  { to: '/emergency', key: 'nav.emergency', icon: <Ambulance size={18} /> },
  { to: '/bus', key: 'nav.bus', icon: <Bus size={18} /> },
  { to: '/provider', key: 'nav.provider', icon: <UserRound size={18} />, roles: ['provider', 'volunteer', 'admin'] },
  { to: '/admin', key: 'nav.admin', icon: <Settings size={18} />, roles: ['admin'] },
];

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();

  const visible = NAV.filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <>
      {/* Backdrop only on small screens */}
      {open && (
        <div
          className="fixed inset-0 z-[900] bg-deep/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'glass fixed bottom-4 start-4 top-4 z-[950] flex w-[240px] flex-col rounded-[26px] p-4 shadow-float',
          'transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-[110%] rtl:translate-x-[110%]',
          'lg:translate-x-0 lg:rtl:translate-x-0',
        )}
      >
        <div className="flex items-center gap-3 px-1">
          <ArchIcon tone="deep" size={40}>
            <span className="text-lg font-black">ن</span>
          </ArchIcon>
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold leading-tight text-ink">
              {t('app.name')}
            </p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
              Tunisia
            </p>
          </div>
          <button
            onClick={onClose}
            className="ms-auto grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 lg:hidden"
            aria-label={t('common.close')}
          >
            <X size={16} />
          </button>
        </div>

        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto scroll-thin">
          {visible.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              end={item.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors',
                  isActive
                    ? 'bg-brand text-white shadow-soft'
                    : 'text-muted hover:bg-surface-2 hover:text-ink',
                )
              }
            >
              {item.icon}
              <span>{t(item.key)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-3 rounded-2xl border border-line bg-surface/70 p-3">
          {user ? (
            <>
              <div className="flex items-center gap-2.5">
                <ArchIcon tone="brand" size={32}>
                  <span className="text-[13px] font-bold">
                    {user.fullName.trim().charAt(0).toUpperCase()}
                  </span>
                </ArchIcon>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-bold text-ink">{user.fullName}</p>
                  <p className="truncate text-[10px] text-muted">{t(`role.${user.role}`)}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line py-1.5 text-[11px] font-semibold text-muted transition-colors hover:border-danger/40 hover:text-danger"
              >
                <LogOut size={12} /> {t('nav.logout')}
              </button>
            </>
          ) : (
            <Button size="sm" fullWidth onClick={() => navigate('/login')}>
              {t('nav.login')}
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}

function LanguagePicker() {
  const { lang, setLang, languages, t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t('common.language')}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="glass flex h-10 items-center gap-1.5 rounded-xl px-3 text-[12px] font-bold text-ink shadow-soft"
      >
        <Globe size={15} />
        {languages.find((l) => l.id === lang)?.label}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[1000]" onClick={() => setOpen(false)} />
            <motion.ul
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              role="listbox"
              className="absolute end-0 top-12 z-[1001] w-36 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-float"
            >
              {languages.map((l) => (
                <li key={l.id}>
                  <button
                    role="option"
                    aria-selected={l.id === lang}
                    onClick={() => {
                      setLang(l.id as Lang);
                      setOpen(false);
                    }}
                    className={clsx(
                      'w-full px-3 py-2 text-start text-[12px] font-semibold transition-colors',
                      l.id === lang ? 'bg-brand/10 text-brand' : 'text-ink hover:bg-surface-2',
                    )}
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </motion.ul>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/** One-click emergency access. Opens a sheet with the official numbers. */
function SosButton() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(true)}
        className="animate-pulse-ring fixed bottom-6 end-6 z-[940] flex h-14 items-center gap-2 rounded-2xl bg-danger px-5 text-white shadow-float"
        aria-label={t('sos.label')}
      >
        <ShieldAlert size={20} />
        <span className="text-sm font-extrabold tracking-wide">{t('sos.label')}</span>
      </motion.button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('sos.label')} width="max-w-md">
        <div className="space-y-4">
          <p className="rounded-xl border border-danger/25 bg-danger/8 p-3 text-[13px] font-semibold leading-relaxed text-danger">
            {t('emergency.notice')}
          </p>

          <div className="grid gap-2">
            <a
              href="tel:190"
              className="flex items-center justify-between rounded-xl bg-danger px-4 py-3 text-white"
            >
              <span className="text-sm font-bold">SAMU 190</span>
              <Phone size={16} />
            </a>
            <a
              href="tel:198"
              className="flex items-center justify-between rounded-xl bg-deep px-4 py-3 text-white"
            >
              <span className="text-sm font-bold">Protection Civile 198</span>
              <Phone size={16} />
            </a>
          </div>

          <Button
            variant="outline"
            fullWidth
            onClick={() => {
              setOpen(false);
              navigate('/emergency');
            }}
          >
            {t('emergency.findNearby')}
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="relative min-h-screen bg-bg">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      {/* Top-right control cluster (in RTL it flips automatically) */}
      <div className="fixed end-4 top-4 z-[930] flex items-center gap-2">
        <button
          onClick={() => setOpen(true)}
          aria-label="Menu"
          className="glass grid h-10 w-10 place-items-center rounded-xl text-ink shadow-soft lg:hidden"
        >
          <Menu size={18} />
        </button>

        <LanguagePicker />

        <button
          onClick={toggle}
          aria-label={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
          title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
          className="glass grid h-10 w-10 place-items-center rounded-xl text-ink shadow-soft"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {!user && (
          <Link
            to="/login"
            className="glass hidden h-10 items-center rounded-xl px-3 text-[12px] font-bold text-ink shadow-soft sm:flex"
          >
            {t('nav.login')}
          </Link>
        )}
      </div>

      <SosButton />

      <main key={location.pathname} className="min-h-screen ps-0 lg:ps-[264px]">
        {children}
      </main>
    </div>
  );
}
