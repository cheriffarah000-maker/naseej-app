import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Clock3, Phone, X } from 'lucide-react';
import clsx from 'clsx';
import MapView from '../components/MapView';
import { AppBar } from '../components/AppShell';
import { Button, Card, Chip, EmptyState, Skeleton, useToast } from '../components/ui';
import { useI18n } from '../lib/i18n';
import { emergencyApi, errorKey } from '../lib/api';
import type { HelpRequest } from '../lib/types';

const STEPS = ['pending', 'accepted', 'completed'] as const;

export default function RequestStatus() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();

  const [request, setRequest] = useState<HelpRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async (first = false) => {
      try {
        const data = await emergencyApi.getRequest(id);
        if (cancelled) return;
        setRequest((prev) => {
          if (prev && prev.status !== data.status) {
            toast.push(`${t('admin.status')}: ${t(`status.${data.status}`)}`, 'info');
          }
          return data;
        });
      } catch (err) {
        if (!cancelled && first) setError(t(errorKey(err)));
      } finally {
        if (!cancelled && first) setLoading(false);
      }
    };

    load(true);
    const interval = window.setInterval(() => load(false), 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [id, t, toast]);

  async function cancel() {
    if (!request) return;
    setCancelling(true);
    try {
      setRequest(await emergencyApi.setStatus(request.id, 'cancelled'));
      toast.push(t('status.cancelled'), 'success');
    } catch (err) {
      toast.push(t(errorKey(err)), 'error');
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col bg-bg">
        <AppBar title={t('emergency.myRequests')} onBack={() => navigate(-1)} />
        <div className="space-y-3 p-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex h-full flex-col bg-bg">
        <AppBar title={t('emergency.myRequests')} onBack={() => navigate(-1)} />
        <EmptyState
          icon={<Clock3 size={20} />}
          title={t('empty.title')}
          hint={error ?? undefined}
          action={
            <Button variant="outline" size="sm" onClick={() => navigate('/emergency')}>
              {t('common.back')}
            </Button>
          }
        />
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(request.status as any);
  const isClosed = ['declined', 'cancelled'].includes(request.status);
  const tone =
    request.status === 'accepted'
      ? 'success'
      : request.status === 'pending'
        ? 'warning'
        : request.status === 'completed'
          ? 'info'
          : 'danger';

  return (
    <div className="flex h-full flex-col bg-bg">
      <AppBar title={t('emergency.myRequests')} onBack={() => navigate(-1)} />

      <div className="flex-1 space-y-3 overflow-y-auto p-4 scroll-thin">
        <Card className="p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted">
              {new Date(request.createdAt).toLocaleTimeString()}
            </span>
            <Chip tone={tone as any}>{t(`status.${request.status}`)}</Chip>
          </div>

          <ol className="relative mt-3 space-y-4 ps-5">
            <span className="absolute bottom-2 start-[6px] top-2 w-px bg-line" />
            {STEPS.map((step, index) => {
              const done = !isClosed && currentIndex >= index;
              const isCurrent = !isClosed && currentIndex === index;
              return (
                <li key={step} className="relative">
                  <span
                    className={clsx(
                      'absolute -start-5 top-0 grid h-3.5 w-3.5 place-items-center rounded-full border-2',
                      done ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-transparent',
                      isCurrent && 'animate-pulse',
                    )}
                  >
                    <Check size={8} strokeWidth={3.5} />
                  </span>
                  <p className={clsx('text-[12.5px] font-bold', done ? 'text-ink' : 'text-muted')}>
                    {t(`status.${step}`)}
                  </p>
                </li>
              );
            })}
          </ol>

          {isClosed && (
            <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-danger/8 px-2.5 py-2 text-[11.5px] font-bold text-danger">
              <X size={12} /> {t(`status.${request.status}`)}
            </p>
          )}
        </Card>

        <Card className="p-3.5">
          <h2 className="mb-1.5 text-[10.5px] font-extrabold uppercase tracking-wide text-muted">
            {t('emergency.assignedTo')}
          </h2>
          <p className="text-[14px] font-extrabold text-ink">
            {request.providerName ?? t('common.searching')}
          </p>
          {request.providerPhone && (
            <a
              href={`tel:${request.providerPhone}`}
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-[12px] font-bold text-white"
            >
              <Phone size={13} /> {request.providerPhone}
            </a>
          )}

          {request.note && (
            <p className="mt-2.5 rounded-lg bg-surface-2 px-2.5 py-2 text-[11.5px] text-muted">
              {request.note}
            </p>
          )}

          {(request.status === 'pending' || request.status === 'accepted') && (
            <Button
              variant="outline"
              size="sm"
              fullWidth
              className="mt-3"
              loading={cancelling}
              onClick={cancel}
            >
              {t('emergency.cancelRequest')}
            </Button>
          )}
        </Card>

        <Card className="h-44 overflow-hidden p-0">
          <MapView
            className="h-full w-full"
            center={{ lat: request.lat, lng: request.lng }}
            zoom={15}
            me={{ lat: request.lat, lng: request.lng }}
            draggableMe={false}
            ariaLabel={t('emergency.yourPosition')}
          />
        </Card>

        <p className="px-1 pb-2 text-center text-[10px] leading-relaxed text-muted">
          {t('emergency.notice')}
        </p>
      </div>
    </div>
  );
}
