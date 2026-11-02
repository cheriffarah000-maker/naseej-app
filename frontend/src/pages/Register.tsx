import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ambulance, Bus, HeartPulse, UserPlus, Users } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../lib/i18n';
import { errorKey } from '../lib/api';
import { Button, Field, Input } from '../components/ui';
import { AppBar } from '../components/AppShell';

const ROLES = [
  { id: 'citizen', icon: Users },
  { id: 'student', icon: Bus },
  { id: 'provider', icon: Ambulance },
  { id: 'volunteer', icon: HeartPulse },
  { id: 'driver', icon: Bus },
];

export default function Register() {
  const { register } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [role, setRole] = useState('citizen');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^\d{8}$/.test(phone.replace(/\s/g, ''))) {
      setError(t('auth.errors.phone'));
      return;
    }

    setLoading(true);
    try {
      const user = await register({
        fullName,
        email,
        phone: phone.replace(/\s/g, ''),
        password,
        role,
      });
      if (user.role === 'provider' || user.role === 'volunteer') navigate('/provider', { replace: true });
      else if (user.role === 'driver') navigate('/bus', { replace: true });
      else navigate('/', { replace: true });
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      <AppBar title={t('auth.register.title')} subtitle={t('auth.register.subtitle')} onBack={() => navigate('/welcome')} />

      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 scroll-thin">
          {/* Role picker — one clear decision, big touch targets */}
          <div className="grid grid-cols-5 gap-1.5">
            {ROLES.map(({ id, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setRole(id)}
                aria-pressed={role === id}
                className={clsx(
                  'flex flex-col items-center gap-1.5 rounded-2xl border px-1 py-2.5 transition-all',
                  role === id
                    ? 'border-brand bg-brand/8'
                    : 'border-line bg-surface hover:border-brand/40',
                )}
              >
                <span
                  className={clsx(
                    'grid h-9 w-9 place-items-center rounded-arch transition-colors',
                    role === id ? 'bg-brand text-white' : 'bg-surface-2 text-muted',
                  )}
                >
                  <Icon size={16} />
                </span>
                <span
                  className={clsx(
                    'text-center text-[9px] font-bold leading-tight',
                    role === id ? 'text-brand' : 'text-muted',
                  )}
                >
                  {t(`role.${id}`)}
                </span>
              </button>
            ))}
          </div>

          <p className="rounded-xl bg-surface-2 px-3 py-2 text-[11.5px] leading-relaxed text-muted">
            {t(`role.${role}.hint`)}
          </p>

          <Field label={t('auth.register.fullName')} htmlFor="reg-name">
            <Input
              id="reg-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Sami Ben Ali"
              autoComplete="name"
              required
            />
          </Field>

          <Field label={t('auth.register.email')} htmlFor="reg-email">
            <Input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.tn"
              autoComplete="email"
              required
            />
          </Field>

          <Field
            label={t('auth.register.phone')}
            hint={t('auth.register.phoneHint')}
            htmlFor="reg-phone"
          >
            <div className="flex items-center gap-2">
              <span className="grid h-11 shrink-0 place-items-center rounded-xl border border-line bg-surface-2 px-3 text-[13px] font-bold text-muted">
                +216
              </span>
              <Input
                id="reg-phone"
                inputMode="numeric"
                maxLength={11}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ''))}
                placeholder="12 345 678"
                required
              />
            </div>
          </Field>

          <Field label={t('auth.register.password')} htmlFor="reg-password">
            <Input
              id="reg-password"
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </Field>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-danger/25 bg-danger/8 px-3 py-2.5 text-[12px] font-semibold text-danger"
            >
              {error}
            </p>
          )}
        </div>

        <div className="border-t border-line px-5 py-3.5">
          <Button type="submit" size="lg" fullWidth loading={loading} icon={<UserPlus size={17} />}>
            {t('auth.register.submit')}
          </Button>
          <p className="mt-2.5 text-center text-[12px] text-muted">
            {t('auth.register.haveAccount')}{' '}
            <Link to="/login" className="font-bold text-brand">
              {t('nav.login')}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
