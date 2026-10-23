import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { formatDateTime, formatMoney, formatNumber } from '../lib/format';
import { EmptyState, ErrorState, PageLoader } from '../components/ui';
import { ArrowLeftIcon, ClockIcon, PlayIcon, ReceiptIcon } from '../components/icons';
import type { Purchase } from '../types';

function expiryDate(purchase: Purchase): Date | null {
  if (!purchase.expiresAt) return null;
  const iso = purchase.expiresAt.includes('T')
    ? purchase.expiresAt
    : purchase.expiresAt.replace(' ', 'T') + 'Z';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function canWatch(purchase: Purchase): boolean {
  if (purchase.status !== 'paid') return false;
  if (purchase.kind === 'buy') return true;
  const expiry = expiryDate(purchase);
  return expiry !== null && expiry.getTime() > Date.now();
}

export function PurchasesPage() {
  const purchases = useAsync((signal) => api.payments.mine(signal), []);

  if (purchases.status === 'loading' && !purchases.data) {
    return <PageLoader label="Cargando tus compras" />;
  }

  if (purchases.status === 'error') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState
          title="No pudimos cargar tus compras"
          message={purchases.error ?? 'Intenta de nuevo en unos segundos.'}
          onRetry={purchases.reload}
        />
      </div>
    );
  }

  const items = purchases.data?.items ?? [];
  const paid = items.filter((item) => item.status === 'paid');
  const active = paid.filter(canWatch);
  const spent = paid.reduce((total, item) => total + item.amountCents, 0);
  const currency = paid[0]?.currency ?? 'EUR';

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        to="/cuenta"
        className="inline-flex items-center gap-2 text-sm text-cloud-300 transition hover:text-brand-300"
      >
        <ArrowLeftIcon width={16} height={16} /> Mi cuenta
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Mis compras</h1>
          <p className="mt-1 text-sm text-cloud-400">
            Tus alquileres y compras en Pelipop, con su referencia de pago.
          </p>
        </div>
        <Link to="/catalogo" className="btn-ghost btn-sm">
          Explorar catalogo
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Titulos disponibles" value={formatNumber(active.length)} />
        <StatCard label="Compras realizadas" value={formatNumber(paid.length)} />
        <StatCard label="Total gastado" value={formatMoney(spent, currency)} />
      </div>

      <div className="mt-8">
        {items.length === 0 ? (
          <EmptyState
            title="Todavia no has comprado nada"
            message="Cuando alquiles o compres una pelicula aparecera aqui, lista para reproducir."
            action={
              <Link to="/catalogo" className="btn-primary">
                Ver catalogo
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {items.map((purchase) => (
              <PurchaseRow key={purchase.id} purchase={purchase} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold tracking-wide text-cloud-400 uppercase">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function PurchaseRow({ purchase }: { purchase: Purchase }) {
  const watchable = canWatch(purchase);
  const expired =
    purchase.status === 'paid' &&
    purchase.kind === 'rent' &&
    !watchable;
  const movie = purchase.movie;

  return (
    <li className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <Link
        to={`/pelicula/${movie.slug}`}
        className="h-28 w-20 shrink-0 overflow-hidden rounded-lg border border-ink-700 bg-ink-800"
      >
        {movie.posterUrl ? (
          <img src={movie.posterUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-[10px] text-cloud-400">Sin poster</div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/pelicula/${movie.slug}`}
            className="truncate font-semibold transition hover:text-brand-300"
          >
            {movie.title}
          </Link>
          <span className={purchase.kind === 'buy' ? 'badge-brand' : 'badge-mint'}>
            {purchase.kind === 'buy' ? 'Compra' : 'Alquiler'}
          </span>
          <span className={purchase.status === 'paid' ? 'badge-mint' : 'badge-red'}>
            {purchase.status === 'paid' ? 'Pagado' : 'Rechazado'}
          </span>
          {expired && <span className="badge text-cloud-400">Caducado</span>}
        </div>

        <p className="mt-1 text-xs text-cloud-400">
          {formatDateTime(purchase.paidAt ?? purchase.createdAt)} ·{' '}
          {purchase.method === 'card' ? `Tarjeta ····${purchase.cardLast4 ?? ''}` : 'PayPal'} ·{' '}
          <span className="font-mono">{purchase.reference}</span>
        </p>

        {purchase.status === 'paid' && purchase.expiresAt && (
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-cloud-300">
            <ClockIcon width={13} height={13} />
            {watchable ? 'Disponible hasta' : 'Caduco el'} {formatDateTime(purchase.expiresAt)}
          </p>
        )}

        {purchase.status === 'failed' && purchase.failureReason && (
          <p className="mt-1 text-xs text-red-300">{purchase.failureReason}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end">
        <span
          className={`font-bold ${purchase.status === 'paid' ? 'text-cloud-100' : 'text-cloud-400 line-through'}`}
        >
          {formatMoney(purchase.amountCents, purchase.currency)}
        </span>

        {watchable ? (
          <Link
            to={`/pelicula/${movie.slug}?reproducir=1`}
            className="btn-primary btn-sm"
          >
            <PlayIcon width={14} height={14} /> Ver
          </Link>
        ) : purchase.status === 'failed' ? (
          <Link to={`/pago/${movie.slug}?kind=${purchase.kind}`} className="btn-ghost btn-sm">
            Reintentar
          </Link>
        ) : (
          <Link to={`/pago/${movie.slug}?kind=${purchase.kind}`} className="btn-ghost btn-sm">
            <ReceiptIcon width={14} height={14} /> {expired ? 'Alquilar de nuevo' : 'Comprar'}
          </Link>
        )}
      </div>
    </li>
  );
}
