import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PhoneCall, ShieldAlert, Siren } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { AppBar } from '../components/AppShell';
import { Button } from '../components/ui';

/**
 * The SOS screen. Deliberately minimal: two giant phone buttons and nothing
 * that can be misread under stress. It never pretends to replace the official
 * services — it connects to them.
 */
export default function Sos() {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col bg-surface">
      <AppBar title={t('home.sosTitle')} onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto px-5 py-5 scroll-thin">
        <div className="relative overflow-hidden rounded-[22px] bg-danger/8 p-4">
          <ShieldAlert size={20} className="text-danger" />
          <p className="mt-2 text-[13px] font-bold leading-relaxed text-danger">
            {t('emergency.notice')}
          </p>
        </div>

        <div className="mt-5 space-y-3">
          <a
            href="tel:190"
            className="flex items-center gap-3.5 rounded-[22px] bg-danger p-4 text-white shadow-float active:scale-[0.99]"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20">
              <PhoneCall size={22} />
            </span>
            <span className="flex-1">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-white/75">
                SAMU
              </span>
              <span className="block text-[26px] font-black leading-tight">190</span>
            </span>
          </a>

          <a
            href="tel:198"
            className="flex items-center gap-3.5 rounded-[22px] bg-deep p-4 text-white shadow-float active:scale-[0.99]"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15">
              <Siren size={22} />
            </span>
            <span className="flex-1">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-white/70">
                {t('common.call')} · 198
              </span>
              <span className="block text-[26px] font-black leading-tight">198</span>
            </span>
          </a>
        </div>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-muted">
          {t('emergency.subtitle')}
        </p>
      </div>

      <div className="border-t border-line px-5 py-3.5">
        <Button
          variant="outline"
          size="lg"
          fullWidth
          onClick={() => navigate('/emergency')}
        >
          {t('emergency.findNearby')}
        </Button>
      </div>
    </div>
  );
}
