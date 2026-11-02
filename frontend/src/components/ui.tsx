import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, Loader2, X } from 'lucide-react';

/* ========================================================================== */
/* Button                                                                     */
/* ========================================================================== */
type ButtonVariant = 'primary' | 'danger' | 'outline' | 'ghost' | 'sand';
type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark shadow-soft',
  danger: 'bg-danger text-white hover:brightness-110 shadow-soft',
  outline: 'border border-line text-ink hover:bg-surface-2',
  ghost: 'text-ink hover:bg-surface-2',
  sand: 'bg-sand text-deep hover:brightness-[0.98] border border-gold/30',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-[13px] rounded-lg gap-1.5',
  md: 'h-11 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-[15px] rounded-xl gap-2',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  fullWidth,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-semibold transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.985]',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

export function IconButton({
  label,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={clsx(
        'inline-grid h-10 w-10 place-items-center rounded-xl border border-line',
        'bg-surface text-ink transition-colors hover:bg-surface-2',
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ========================================================================== */
/* Surfaces                                                                   */
/* ========================================================================== */
export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={clsx(
        'rounded-xl2 border border-line bg-surface shadow-soft',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** The floating frosted panel used over the map. */
export function GlassPanel({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={clsx('glass rounded-[26px] shadow-float', className)}
    >
      {children}
    </div>
  );
}

/** The arch shape borrowed from Sidi Bou Said windows. */
export function ArchIcon({
  children,
  size = 44,
  className,
  tone = 'brand',
}: {
  children?: React.ReactNode;
  size?: number;
  className?: string;
  tone?: 'brand' | 'deep' | 'gold' | 'danger' | 'sand';
}) {
  const tones: Record<string, string> = {
    brand: 'bg-brand/10 text-brand',
    deep: 'bg-deep text-white',
    gold: 'bg-gold/15 text-gold',
    danger: 'bg-danger/10 text-danger',
    sand: 'bg-sand text-deep',
  };
  return (
    <div
      className={clsx(
        'grid shrink-0 place-items-center rounded-arch',
        tones[tone],
        className,
      )}
      style={{ width: size, height: size * 1.16 }}
    >
      {children}
    </div>
  );
}

/* ========================================================================== */
/* Form fields                                                                */
/* ========================================================================== */
export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[13px] font-semibold text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-xs text-danger">
          <AlertCircle size={12} /> {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

const CONTROL =
  'w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink ' +
  'placeholder:text-muted/70 transition-colors hover:border-brand/40 ' +
  'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25';

export function Input({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={clsx(CONTROL, 'h-11', className)} />;
}

export function Textarea({
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={clsx(CONTROL, 'py-2.5 resize-none', className)} />;
}

export function Select({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={clsx(CONTROL, 'h-11 cursor-pointer', className)}>
      {children}
    </select>
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        checked ? 'bg-brand' : 'bg-line',
      )}
    >
      <span
        className={clsx(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
          checked ? 'start-[22px]' : 'start-0.5',
        )}
      />
    </button>
  );
}

/* ========================================================================== */
/* Chips                                                                      */
/* ========================================================================== */
export type ChipTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'gold';

const CHIP_TONES: Record<ChipTone, string> = {
  neutral: 'bg-surface-2 text-muted',
  success: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/14 text-amber-700 dark:text-amber-400',
  danger: 'bg-danger/12 text-danger',
  info: 'bg-brand/12 text-brand',
  gold: 'bg-gold/15 text-gold',
};

export function Chip({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: ChipTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold',
        CHIP_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ========================================================================== */
/* Modal                                                                      */
/* ========================================================================== */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1200] grid place-items-center bg-deep/45 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={clsx(
              'w-full overflow-hidden rounded-xl2 border border-line bg-surface shadow-float',
              width,
            )}
          >
            <header className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-base font-bold text-ink">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
              >
                <X size={16} />
              </button>
            </header>
            <div className="max-h-[70vh] overflow-y-auto px-5 py-4 scroll-thin">{children}</div>
            {footer && (
              <footer className="flex justify-end gap-2 border-t border-line bg-surface-2/40 px-5 py-3">
                {footer}
              </footer>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ========================================================================== */
/* Toasts — the "real-time" feedback channel for status changes               */
/* ========================================================================== */
type ToastTone = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

const ToastContext = createContext<{ push: (message: string, tone?: ToastTone) => void } | null>(
  null,
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  const icons: Record<ToastTone, React.ReactNode> = {
    success: <CheckCircle2 size={16} className="text-emerald-500" />,
    error: <AlertCircle size={16} className="text-danger" />,
    info: <Info size={16} className="text-brand" />,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 end-6 z-[1500] flex w-[min(92vw,360px)] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex items-start gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 shadow-float"
              role="status"
            >
              <span className="mt-0.5">{icons[toast.tone]}</span>
              <p className="text-[13px] font-medium leading-snug text-ink">{toast.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

/* ========================================================================== */
/* Loading / empty states                                                     */
/* ========================================================================== */
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton rounded-lg', className)} />;
}

export function EmptyState({
  title,
  hint,
  icon,
  action,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <div className="relative grid h-16 w-16 place-items-center rounded-arch bg-surface-2 text-muted">
        <div className="zellige absolute inset-0 rounded-arch opacity-40" />
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-ink">{title}</p>
        {hint && <p className="mx-auto mt-1 max-w-[34ch] text-xs leading-relaxed text-muted">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ size = 18 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-brand" />;
}

/** Small helper so every form field has a stable, unique id. */
export function useFieldId(prefix: string) {
  const id = useId();
  return `${prefix}-${id}`;
}
