import React from 'react';
import { BadgeCheck, Phone } from 'lucide-react';
import clsx from 'clsx';
import { useI18n } from '../lib/i18n';
import { formatKm } from '../lib/geo';
import { ArchIcon, Chip } from './ui';
import type { NearbyProvider } from '../lib/types';

export default function ProviderCard({
  provider,
  selected,
  onSelect,
  onCall,
}: {
  provider: NearbyProvider;
  selected?: boolean;
  onSelect?: () => void;
  onCall?: () => void;
}) {
  const { t } = useI18n();
  const isAmbulance = provider.type === 'ambulance';

  return (
    <div
      className={clsx(
        'flex items-center gap-3 rounded-xl border p-2.5 transition-all',
        selected
          ? 'border-brand bg-brand/8 shadow-soft'
          : 'border-line bg-surface hover:border-brand/40',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-3 text-start"
      >
        <ArchIcon tone={isAmbulance ? 'brand' : 'gold'} size={38}>
          <span className="text-[15px]">{isAmbulance ? '✚' : '☩'}</span>
        </ArchIcon>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[13px] font-bold text-ink">{provider.name}</p>
            {provider.isVerified && (
              <BadgeCheck size={13} className="shrink-0 text-brand" aria-label={t('common.verified')} />
            )}
          </div>
          <p className="truncate text-[11px] text-muted">
            {t(`type.${provider.type}`)}
            {provider.serviceArea ? ` · ${provider.serviceArea}` : ''}
          </p>
        </div>
      </button>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <Chip tone={isAmbulance ? 'info' : 'gold'}>{formatKm(provider.distanceKm)}</Chip>
        {onCall && (
          <a
            href={`tel:${provider.phone}`}
            onClick={onCall}
            className="inline-flex items-center gap-1 rounded-lg bg-brand px-2 py-1 text-[10px] font-bold text-white hover:bg-brand-dark"
          >
            <Phone size={10} /> {t('common.call')}
          </a>
        )}
      </div>
    </div>
  );
}
