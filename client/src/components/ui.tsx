import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { AlertIcon, CloseIcon, SpinnerIcon } from './icons';

export function Spinner({ label = 'Cargando' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-cloud-300" role="status" aria-live="polite">
      <SpinnerIcon className="animate-spin text-brand-400" width={20} height={20} />
      <span className="text-sm">{label}...</span>
    </div>
  );
}

export function PageLoader({ label = 'Cargando' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner label={label} />
    </div>
  );
}

export function ErrorState({
  title = 'Algo se ha torcido',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="card border-red-500/30 bg-red-500/5 p-6 text-center">
      <AlertIcon className="mx-auto mb-3 text-red-300" width={32} height={32} />
      <h3 className="text-lg font-semibold text-cloud-100">{title}</h3>
      <p className="mt-1 text-sm text-cloud-300">{message}</p>
      {onRetry && (
        <button type="button" className="btn-ghost mt-4" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="card border-dashed p-10 text-center">
      <h3 className="text-lg font-semibold text-cloud-100">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-cloud-300">{message}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Alert({
  tone = 'error',
  children,
}: {
  tone?: 'error' | 'success' | 'info';
  children: ReactNode;
}) {
  const tones = {
    error: 'border-red-500/40 bg-red-500/10 text-red-200',
    success: 'border-mint-500/40 bg-mint-500/10 text-mint-200',
    info: 'border-brand-500/40 bg-brand-500/10 text-brand-100',
  } as const;

  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-ink-700/60 ${className}`} />;
}

export function PosterSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="aspect-[2/3] w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  tone = 'danger',
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 cursor-default bg-ink-950/80 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="card relative w-full max-w-md bg-ink-800 p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            className="text-cloud-400 transition hover:text-cloud-100"
            onClick={onCancel}
            aria-label="Cerrar"
          >
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        <p className="mt-3 text-sm text-cloud-300">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button
            type="button"
            className={tone === 'danger' ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy && <SpinnerIcon className="animate-spin" width={16} height={16} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ScoreBadge({ score, className = '' }: { score: number; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-ink-950/80 px-2 py-0.5 text-xs font-bold text-mint-300 ring-1 ring-mint-500/40 ${className}`}
      title={`Puntuacion ${score.toFixed(1)} de 10`}
    >
      <span className="text-mint-500">★</span>
      {score.toFixed(1)}
    </span>
  );
}
