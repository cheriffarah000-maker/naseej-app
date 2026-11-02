import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, Check, Crosshair, HeartPulse, Loader2, Phone, X } from 'lucide-react';
import MapView from '../components/MapView';
import { AppBar } from '../components/AppShell';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  Input,
  Select,
  Skeleton,
  Switch,
  useToast,
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { usePosition } from '../hooks/usePosition';
import { useI18n } from '../lib/i18n';
import { emergencyApi, errorKey } from '../lib/api';
import type { HelpRequest, ProviderProfile, ProviderType } from '../lib/types';

export default function ProviderPanel() {
  const { user } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();
  const { position, setPosition, locate, locating } = usePosition();

  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [incoming, setIncoming] = useState<HelpRequest[]>([]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [type, setType] = useState<ProviderType>('ambulance');
  const [serviceArea, setServiceArea] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    emergencyApi
      .myProvider()
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        setName(p.name);
        setPhone(p.phone);
        setType(p.type);
        setServiceArea(p.serviceArea);
      })
      .catch(() => {
        if (!cancelled) {
          setProfile(null);
          setName(user?.fullName ?? '');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    const load = async () => {
      try {
        const list = await emergencyApi.incoming();
        if (!cancelled) {
          setIncoming((prev) => {
            if (list.length > prev.length) toast.push(t('provider.incoming'), 'info');
            return list;
          });
        }
      } catch {
        /* ignore */
      }
    };
    load();
    const interval = window.setInterval(load, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [profile, t, toast]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const saved = await emergencyApi.becomeProvider({
        name,
        phone,
        type,
        serviceArea,
        lat: position.lat,
        lng: position.lng,
      });
      setProfile(saved);
      toast.push(t('admin.saved'), 'success');
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailability(next: boolean) {
    if (!profile) return;
    try {
      setProfile(await emergencyApi.setAvailability(next));
    } catch (err) {
      toast.push(t(errorKey(err)), 'error');
    }
  }

  async function respond(request: HelpRequest, status: 'accepted' | 'declined') {
    try {
      await emergencyApi.setStatus(request.id, status);
      if (status === 'declined') setIncoming((prev) => prev.filter((r) => r.id !== request.id));
      toast.push(t(`status.${status}`), 'success');
    } catch (err) {
      toast.push(t(errorKey(err)), 'error');
    }
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col bg-bg">
        <AppBar title={t('provider.title')} onBack={() => navigate('/')} />
        <div className="space-y-3 p-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-bg">
      <AppBar
        title={t('provider.title')}
        subtitle={t('provider.subtitle')}
        onBack={() => navigate('/')}
        action={
          profile ? (
            <Chip tone={profile.isVerified ? 'success' : 'neutral'} className="me-2 shrink-0">
              {profile.isVerified ? <BadgeCheck size={9} /> : null}
              {profile.isVerified ? t('common.verified') : t('common.unverified')}
            </Chip>
          ) : undefined
        }
      />

      <div className="flex-1 space-y-3 overflow-y-auto p-4 scroll-thin">
        {profile && (
          <Card className="flex items-center gap-3 p-3.5">
            <span className="grid h-11 w-11 place-items-center rounded-arch bg-deep text-white">
              <HeartPulse size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-extrabold text-ink">{t('provider.availability')}</p>
              <p className="text-[11px] text-muted">
                {profile.isAvailable ? t('provider.available') : t('provider.unavailable')}
              </p>
            </div>
            <Switch
              checked={profile.isAvailable}
              onChange={toggleAvailability}
              label={t('provider.availability')}
            />
          </Card>
        )}

        {/* Incoming requests come first once the profile exists: they are urgent. */}
        {profile && (
          <Card className="p-3.5">
            <h2 className="mb-2.5 text-[11px] font-extrabold uppercase tracking-wide text-muted">
              {t('provider.incoming')}
            </h2>
            {incoming.length === 0 ? (
              <EmptyState icon={<Phone size={17} />} title={t('provider.noIncoming')} />
            ) : (
              <div className="space-y-2.5">
                {incoming.map((request) => (
                  <div key={request.id} className="rounded-xl border border-line p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[13px] font-bold text-ink">{request.contactName}</p>
                      <Chip tone="warning">{t(`status.${request.status}`)}</Chip>
                    </div>
                    {request.note && (
                      <p className="mt-1.5 rounded-lg bg-surface-2 px-2 py-1.5 text-[11px] text-muted">
                        {request.note}
                      </p>
                    )}
                    <div className="mt-2 flex gap-1.5">
                      <a
                        href={`tel:${request.contactPhone}`}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-line py-1.5 text-[11px] font-bold text-ink"
                      >
                        <Phone size={11} /> {t('common.call')}
                      </a>
                      <button
                        onClick={() => respond(request, 'accepted')}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 py-1.5 text-[11px] font-bold text-white"
                      >
                        <Check size={11} /> {t('provider.accept')}
                      </button>
                      <button
                        onClick={() => respond(request, 'declined')}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-danger py-1.5 text-[11px] font-bold text-white"
                      >
                        <X size={11} /> {t('provider.decline')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Profile form */}
        <Card className="p-3.5">
          <h2 className="mb-3 text-[12px] font-extrabold text-ink">
            {profile ? t('provider.become') : t('provider.needProfile')}
          </h2>

          <form onSubmit={save} className="space-y-3">
            <Field label={t('provider.name')} htmlFor="p-name">
              <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field label={t('auth.register.phone')} htmlFor="p-phone">
                <Input
                  id="p-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+216…"
                  required
                />
              </Field>
              <Field label={t('provider.type')} htmlFor="p-type">
                <Select
                  id="p-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as ProviderType)}
                >
                  <option value="ambulance">{t('type.ambulance')}</option>
                  <option value="volunteer">{t('type.volunteer')}</option>
                </Select>
              </Field>
            </div>

            <Field label={t('provider.serviceArea')} htmlFor="p-area">
              <Input
                id="p-area"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                placeholder="Ariana, Tunis"
              />
            </Field>

            <div>
              <p className="mb-1.5 text-[12px] font-semibold text-ink">{t('emergency.yourPosition')}</p>
              <div className="h-40 overflow-hidden rounded-xl border border-line">
                <MapView
                  className="h-full w-full"
                  center={position}
                  zoom={13}
                  me={position}
                  onPick={(p) => setPosition(p, false)}
                  ariaLabel={t('emergency.yourPosition')}
                />
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={locate}
                  className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1.5 text-[11px] font-bold text-brand"
                >
                  {locating ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Crosshair size={11} />
                  )}
                  {t('emergency.useMyLocation')}
                </button>
                <span className="text-[10px] text-muted">
                  {position.lat.toFixed(3)}, {position.lng.toFixed(3)}
                </span>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-[11.5px] font-semibold text-danger">
                {error}
              </p>
            )}

            <Button type="submit" fullWidth loading={saving}>
              {t('common.save')}
            </Button>
          </form>
        </Card>

        {profile?.isVerified === false && (
          <p className="px-1 text-center text-[10px] leading-relaxed text-muted">
            {t('provider.verifiedHint')}
          </p>
        )}
      </div>
    </div>
  );
}
