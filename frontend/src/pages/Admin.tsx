import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus as BusIcon, GraduationCap, Plus, Route as RouteIcon, Trash2, Users } from 'lucide-react';
import clsx from 'clsx';
import MapView from '../components/MapView';
import { AppBar } from '../components/AppShell';
import { Button, Card, Chip, EmptyState, Field, Input, Modal, Select, Skeleton, useToast } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../lib/i18n';
import { authApi, errorKey, transportApi } from '../lib/api';
import { TUNIS } from '../lib/geo';
import type { Bus, BusRoute, LatLng, Station, University, User } from '../lib/types';

type Tab = 'universities' | 'routes' | 'buses' | 'users';

/**
 * Admin tools, kept in the same phone shell. Tables become cards: a 520px
 * table would force horizontal scrolling on a 390px screen.
 */
export default function Admin() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();

  const [tab, setTab] = useState<Tab>('universities');
  const [universities, setUniversities] = useState<University[]>([]);
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uniOpen, setUniOpen] = useState(false);
  const [uniName, setUniName] = useState('');
  const [uniCity, setUniCity] = useState('Tunis');
  const [uniPos, setUniPos] = useState<LatLng>(TUNIS);

  const [routeOpen, setRouteOpen] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [routeUni, setRouteUni] = useState('');
  const [stations, setStations] = useState<Station[]>([]);

  const [busOpen, setBusOpen] = useState(false);
  const [plate, setPlate] = useState('');
  const [busRoute, setBusRoute] = useState('');
  const [capacity, setCapacity] = useState(30);

  const isAdmin = user?.role === 'admin';

  async function loadAll() {
    setLoading(true);
    try {
      const [u, r, b] = await Promise.all([
        transportApi.universities(),
        transportApi.routes(),
        transportApi.buses(),
      ]);
      setUniversities(u);
      setRoutes(r);
      setBuses(b);
      setRouteUni((c) => c || u[0]?.id || '');
      setBusRoute((c) => c || r[0]?.id || '');
      if (isAdmin) setUsers(await authApi.listUsers());
    } catch {
      /* keep what loaded */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  if (!isAdmin) {
    return (
      <div className="flex h-full flex-col bg-bg">
        <AppBar title={t('admin.title')} onBack={() => navigate('/profile')} />
        <EmptyState icon={<Users size={20} />} title={t('admin.title')} hint={t('auth.errors.role')} />
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'universities', label: t('admin.universities'), icon: <GraduationCap size={13} /> },
    { id: 'routes', label: t('admin.routes'), icon: <RouteIcon size={13} /> },
    { id: 'buses', label: t('admin.buses'), icon: <BusIcon size={13} /> },
    { id: 'users', label: t('admin.users'), icon: <Users size={13} /> },
  ];

  async function run(action: () => Promise<any>, close: () => void) {
    setSaving(true);
    try {
      await action();
      close();
      toast.push(t('admin.saved'), 'success');
      await loadAll();
    } catch (err) {
      toast.push(t(errorKey(err)), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-bg">
      <AppBar title={t('admin.title')} subtitle={t('app.tagline')} onBack={() => navigate('/profile')} />

      <div className="flex gap-1.5 overflow-x-auto border-b border-line bg-surface px-3 py-2 no-scrollbar">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={clsx(
              'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-colors',
              tab === item.id ? 'bg-brand text-white' : 'bg-surface-2 text-muted',
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 scroll-thin">
        {loading ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : (
          <>
            {tab === 'universities' && (
              <Section
                action={
                  <Button size="sm" icon={<Plus size={13} />} onClick={() => setUniOpen(true)}>
                    {t('admin.createUniversity')}
                  </Button>
                }
              >
                {universities.length === 0 ? (
                  <EmptyState title={t('empty.title')} />
                ) : (
                  universities.map((u) => (
                    <Row key={u.id} title={u.name} meta={`${u.city || '—'} · ${u.lat.toFixed(3)}, ${u.lng.toFixed(3)}`} />
                  ))
                )}
              </Section>
            )}

            {tab === 'routes' && (
              <Section
                action={
                  <Button size="sm" icon={<Plus size={13} />} onClick={() => setRouteOpen(true)}>
                    {t('admin.createRoute')}
                  </Button>
                }
              >
                {routes.length === 0 ? (
                  <EmptyState title={t('empty.title')} />
                ) : (
                  routes.map((r) => (
                    <Row
                      key={r.id}
                      title={r.name}
                      meta={`${universities.find((u) => u.id === r.universityId)?.name ?? '—'} · ${r.stations.length} ${t('admin.stations')}`}
                    />
                  ))
                )}
              </Section>
            )}

            {tab === 'buses' && (
              <Section
                action={
                  <Button size="sm" icon={<Plus size={13} />} onClick={() => setBusOpen(true)}>
                    {t('admin.createBus')}
                  </Button>
                }
              >
                {buses.length === 0 ? (
                  <EmptyState title={t('empty.title')} />
                ) : (
                  buses.map((b) => (
                    <Row
                      key={b.id}
                      title={b.plate}
                      meta={`${routes.find((r) => r.id === b.routeId)?.name ?? '—'} · ${b.capacity} ${t('admin.capacity')}`}
                      chip={t(`bus.status.${b.status}`)}
                    />
                  ))
                )}
              </Section>
            )}

            {tab === 'users' && (
              <Section>
                {users.length === 0 ? (
                  <EmptyState title={t('empty.title')} />
                ) : (
                  users.map((u) => (
                    <Row key={u.id} title={u.fullName} meta={`${u.email} · ${u.phone}`} chip={t(`role.${u.role}`)} />
                  ))
                )}
              </Section>
            )}
          </>
        )}
      </div>

      {/* -------- modals -------- */}
      <Modal
        open={uniOpen}
        onClose={() => setUniOpen(false)}
        title={t('admin.createUniversity')}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setUniOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              loading={saving}
              onClick={() =>
                run(
                  () =>
                    transportApi.createUniversity({
                      name: uniName,
                      city: uniCity,
                      lat: uniPos.lat,
                      lng: uniPos.lng,
                    }),
                  () => setUniOpen(false),
                )
              }
            >
              {t('common.save')}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label={t('admin.name')} htmlFor="u-name">
            <Input id="u-name" value={uniName} onChange={(e) => setUniName(e.target.value)} />
          </Field>
          <Field label={t('admin.city')} htmlFor="u-city">
            <Input id="u-city" value={uniCity} onChange={(e) => setUniCity(e.target.value)} />
          </Field>
          <div className="h-44 overflow-hidden rounded-xl border border-line">
            <MapView className="h-full w-full" center={uniPos} zoom={12} me={uniPos} onPick={setUniPos} />
          </div>
        </div>
      </Modal>

      <Modal
        open={routeOpen}
        onClose={() => setRouteOpen(false)}
        title={t('admin.createRoute')}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setRouteOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              loading={saving}
              onClick={() =>
                run(
                  () =>
                    transportApi.createRoute({
                      name: routeName,
                      universityId: routeUni,
                      stations,
                      color: '#0063d6',
                    }),
                  () => {
                    setRouteOpen(false);
                    setStations([]);
                  },
                )
              }
            >
              {t('common.save')}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label={t('admin.name')} htmlFor="r-name">
            <Input id="r-name" value={routeName} onChange={(e) => setRouteName(e.target.value)} />
          </Field>
          <Field label={t('admin.universities')} htmlFor="r-uni">
            <Select id="r-uni" value={routeUni} onChange={(e) => setRouteUni(e.target.value)}>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </Field>
          <div>
            <p className="mb-1.5 text-[11px] text-muted">
              {t('admin.stations')} ({stations.length}) — {t('emergency.clickMap')}
            </p>
            <div className="h-40 overflow-hidden rounded-xl border border-line">
              <MapView
                className="h-full w-full"
                center={TUNIS}
                zoom={12}
                onPick={(p) =>
                  setStations((prev) => [
                    ...prev,
                    { name: `${t('bus.station')} ${prev.length + 1}`, lat: p.lat, lng: p.lng },
                  ])
                }
              />
            </div>
            {stations.length > 0 && (
              <ul className="mt-2 space-y-1">
                {stations.map((station, index) => (
                  <li
                    key={`${station.name}-${index}`}
                    className="flex items-center justify-between rounded-lg border border-line px-2.5 py-1.5"
                  >
                    <span className="text-[11px] font-semibold text-ink">{station.name}</span>
                    <button
                      onClick={() => setStations((prev) => prev.filter((_, i) => i !== index))}
                      aria-label="Remove"
                      className="text-muted"
                    >
                      <Trash2 size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={busOpen}
        onClose={() => setBusOpen(false)}
        title={t('admin.createBus')}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setBusOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              loading={saving}
              onClick={() =>
                run(
                  () => transportApi.createBus({ plate, routeId: busRoute, capacity }),
                  () => setBusOpen(false),
                )
              }
            >
              {t('common.save')}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label={t('admin.plate')} htmlFor="b-plate">
            <Input id="b-plate" value={plate} onChange={(e) => setPlate(e.target.value)} />
          </Field>
          <Field label={t('admin.routes')} htmlFor="b-route">
            <Select id="b-route" value={busRoute} onChange={(e) => setBusRoute(e.target.value)}>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('admin.capacity')} htmlFor="b-cap">
            <Input
              id="b-cap"
              type="number"
              min={1}
              max={120}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

function Section({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="space-y-2">
      {action && <div className="flex justify-end">{action}</div>}
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ title, meta, chip }: { title: string; meta: string; chip?: string }) {
  return (
    <Card className="flex items-center gap-2 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-bold text-ink">{title}</p>
        <p className="truncate text-[10.5px] text-muted">{meta}</p>
      </div>
      {chip && <Chip tone="info">{chip}</Chip>}
    </Card>
  );
}
