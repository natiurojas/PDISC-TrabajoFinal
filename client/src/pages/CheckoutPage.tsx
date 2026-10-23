import { useMemo, useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api, errorMessage } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { formatDateTime, formatMoney, formatRuntime } from '../lib/format';
import { Alert, ErrorState, PageLoader, Spinner } from '../components/ui';
import {
  ArrowLeftIcon,
  CheckIcon,
  CreditCardIcon,
  LockIcon,
  ReceiptIcon,
  ShieldIcon,
  WalletIcon,
} from '../components/icons';
import type { CheckoutResult, PaymentMethod, PurchaseKind } from '../types';

interface Receipt {
  result: CheckoutResult;
  kind: PurchaseKind;
}

function groupCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

export function CheckoutPage() {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const kind: PurchaseKind = searchParams.get('kind') === 'buy' ? 'buy' : 'rent';
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState(user?.displayName ?? '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paypalEmail, setPaypalEmail] = useState(user?.email ?? '');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const movie = useAsync((signal) => api.movies.get(slug, signal), [slug]);
  const access = useAsync((signal) => api.payments.access(slug, signal), [slug]);
  const testCards = useAsync((signal) => api.payments.testCards(signal), []);

  const prices = useMemo(
    () => ({ rent: movie.data?.rentPriceCents ?? 0, buy: movie.data?.buyPriceCents ?? 0 }),
    [movie.data],
  );
  const currency = access.data?.prices.currency ?? 'EUR';
  const amountCents = kind === 'rent' ? prices.rent : prices.buy;

  const permanent =
    access.data?.entitlement.kind === 'buy' ||
    access.data?.entitlement.source === 'staff' ||
    access.data?.entitlement.source === 'free';
  const activeRent = access.data?.entitlement.kind === 'rent';

  function selectKind(next: PurchaseKind) {
    const params = new URLSearchParams(searchParams);
    params.set('kind', next);
    setSearchParams(params, { replace: true });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    setBusy(true);
    try {
      const result = await api.payments.checkout({
        idOrSlug: slug,
        kind,
        method,
        ...(method === 'card'
          ? { cardNumber, cardName, cardExpiry, cardCvv }
          : { paypalEmail }),
      });

      if (result.ok) {
        setReceipt({ result, kind });
      } else {
        setError(result.message);
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  if (movie.status === 'loading' && !movie.data) return <PageLoader label="Preparando el pago" />;

  if (movie.status === 'error' || !movie.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState
          title="No encontramos esa pelicula"
          message={movie.error ?? 'La pelicula solicitada no existe.'}
          onRetry={movie.reload}
        />
      </div>
    );
  }

  const data = movie.data;

  if (receipt) {
    const { result, kind: paidKind } = receipt;
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="card p-8 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-mint-500/15 text-mint-300">
            <CheckIcon width={34} height={34} />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Pago completado</h1>
          <p className="mt-1 text-sm text-cloud-300">{result.message}</p>

          <dl className="mt-6 space-y-2 rounded-xl border border-ink-700 bg-ink-950/40 p-4 text-left text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-cloud-400">Pelicula</dt>
              <dd className="text-right font-medium">{data.title}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-cloud-400">Operacion</dt>
              <dd className="text-right font-medium">
                {paidKind === 'rent' ? 'Alquiler' : 'Compra'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-cloud-400">Importe</dt>
              <dd className="text-right font-medium">
                {formatMoney(result.purchase.amountCents, result.purchase.currency)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-cloud-400">Metodo</dt>
              <dd className="text-right font-medium">
                {result.purchase.method === 'card'
                  ? `Tarjeta ····${result.purchase.cardLast4 ?? ''}`
                  : 'PayPal'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-cloud-400">Referencia</dt>
              <dd className="text-right font-mono text-xs">{result.purchase.reference}</dd>
            </div>
            {result.purchase.expiresAt && (
              <div className="flex justify-between gap-4">
                <dt className="text-cloud-400">Disponible hasta</dt>
                <dd className="text-right font-medium">{formatDateTime(result.purchase.expiresAt)}</dd>
              </div>
            )}
          </dl>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to={`/pelicula/${data.slug}?reproducir=1`} className="btn-primary px-6">
              Ver ahora
            </Link>
            <Link to="/mis-compras" className="btn-ghost px-6">
              Mis compras
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (permanent) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="card p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-500/15 text-brand-300">
            <ShieldIcon width={28} height={28} />
          </span>
          <h1 className="mt-4 text-xl font-bold">Ya tienes acceso</h1>
          <p className="mt-2 text-sm text-cloud-300">
            {access.data?.entitlement.source === 'free'
              ? 'Esta pelicula es gratuita.'
              : access.data?.entitlement.source === 'staff'
                ? 'Tu rol de equipo tiene acceso de previsualizacion.'
                : 'Compraste esta pelicula: puedes verla siempre que quieras.'}
          </p>
          <Link to={`/pelicula/${data.slug}?reproducir=1`} className="btn-primary mt-6 px-6">
            Ver pelicula
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        to={`/pelicula/${data.slug}`}
        className="inline-flex items-center gap-2 text-sm text-cloud-300 transition hover:text-brand-300"
      >
        <ArrowLeftIcon width={16} height={16} /> Volver a la ficha
      </Link>

      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Finalizar compra</h1>
      <p className="mt-1 text-sm text-cloud-400">
        Pasarela simulada: no se realizara ningun cargo real.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
        {/* Resumen del pedido */}
        <aside className="card h-fit p-6">
          <h2 className="text-sm font-bold tracking-wide text-cloud-200 uppercase">Tu pedido</h2>

          <div className="mt-4 flex gap-4">
            <div className="h-32 w-22 shrink-0 overflow-hidden rounded-lg border border-ink-700 bg-ink-800">
              {data.posterUrl ? (
                <img src={data.posterUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-xs text-cloud-400">Sin poster</div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold">{data.title}</p>
              <p className="mt-1 text-xs text-cloud-400">
                {data.releaseYear ?? 's/f'} · {formatRuntime(data.runtimeMinutes)}
              </p>
              <p className="mt-2 line-clamp-3 text-xs text-cloud-300">{data.genres.map((g) => g.name).join(', ')}</p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <KindOption
              active={kind === 'rent'}
              onClick={() => selectKind('rent')}
              title={`Alquiler ${access.data?.rentDurationHours ?? 48} horas`}
              price={prices.rent}
              currency={currency}
              disabled={activeRent || prices.rent <= 0}
              hint={activeRent ? 'Ya tienes un alquiler activo' : undefined}
            />
            <KindOption
              active={kind === 'buy'}
              onClick={() => selectKind('buy')}
              title="Compra permanente"
              price={prices.buy}
              currency={currency}
              disabled={prices.buy <= 0}
              hint={prices.buy <= 0 ? 'No disponible' : undefined}
            />
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-ink-700 pt-4">
            <span className="text-sm text-cloud-400">Total</span>
            <span className="text-2xl font-extrabold">{formatMoney(amountCents, currency)}</span>
          </div>

          <p className="mt-4 flex items-start gap-2 text-xs text-cloud-400">
            <LockIcon width={14} height={14} className="mt-0.5 shrink-0" />
            Los datos de la tarjeta nunca salen del servidor de demostracion y no se almacenan.
          </p>
        </aside>

        {/* Formulario de pago */}
        <section className="card p-6">
          <h2 className="text-sm font-bold tracking-wide text-cloud-200 uppercase">Metodo de pago</h2>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(
              [
                { id: 'card', label: 'Tarjeta', icon: CreditCardIcon },
                { id: 'paypal', label: 'PayPal', icon: WalletIcon },
              ] as const
            ).map((option) => {
              const Icon = option.icon;
              const active = method === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMethod(option.id)}
                  aria-pressed={active}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? 'border-brand-500 bg-brand-500/10 text-brand-200'
                      : 'border-ink-600 text-cloud-300 hover:border-brand-500/60'
                  }`}
                >
                  <Icon width={18} height={18} /> {option.label}
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mt-5">
              <Alert tone="error">{error}</Alert>
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
            {method === 'card' ? (
              <>
                <div>
                  <label htmlFor="cardNumber" className="label">
                    Numero de tarjeta
                  </label>
                  <input
                    id="cardNumber"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={cardNumber}
                    onChange={(event) => setCardNumber(groupCardNumber(event.target.value))}
                    placeholder="4242 4242 4242 4242"
                    className="input font-mono"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="cardName" className="label">
                    Titular
                  </label>
                  <input
                    id="cardName"
                    value={cardName}
                    onChange={(event) => setCardName(event.target.value)}
                    autoComplete="cc-name"
                    className="input"
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="cardExpiry" className="label">
                      Caducidad (MM/AA)
                    </label>
                    <input
                      id="cardExpiry"
                      value={cardExpiry}
                      onChange={(event) => setCardExpiry(event.target.value)}
                      placeholder="12/30"
                      autoComplete="cc-exp"
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="cardCvv" className="label">
                      CVV
                    </label>
                    <input
                      id="cardCvv"
                      inputMode="numeric"
                      value={cardCvv}
                      onChange={(event) => setCardCvv(event.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="123"
                      autoComplete="cc-csc"
                      className="input"
                      required
                    />
                  </div>
                </div>

                {testCards.data && testCards.data.items.length > 0 && (
                  <div className="rounded-lg border border-ink-700 bg-ink-950/40 p-3">
                    <p className="text-xs font-semibold text-cloud-300">
                      Tarjetas de prueba (pulsa para rellenar):
                    </p>
                    <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                      {testCards.data.items.map((card) => (
                        <button
                          key={card.number}
                          type="button"
                          onClick={() => {
                            setCardNumber(groupCardNumber(card.number));
                            if (!cardExpiry) setCardExpiry('12/30');
                            if (!cardCvv) setCardCvv('123');
                          }}
                          className="flex items-center justify-between gap-2 rounded-md border border-ink-600 px-2.5 py-1.5 text-left text-xs transition hover:border-brand-500/60"
                        >
                          <span className="font-mono text-cloud-200">
                            {groupCardNumber(card.number)}
                          </span>
                          <span className={card.outcome === 'paid' ? 'text-mint-300' : 'text-red-300'}>
                            {card.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div>
                <label htmlFor="paypalEmail" className="label">
                  Correo de PayPal
                </label>
                <input
                  id="paypalEmail"
                  type="email"
                  value={paypalEmail}
                  onChange={(event) => setPaypalEmail(event.target.value)}
                  autoComplete="email"
                  className="input"
                  required
                />
                <p className="mt-2 text-xs text-cloud-400">
                  En la simulacion, PayPal siempre aprueba el pago.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-700 pt-4">
              <span className="flex items-center gap-2 text-xs text-cloud-400">
                <ReceiptIcon width={14} height={14} /> Recibiras una referencia de pago
              </span>
              <button type="submit" className="btn-primary px-6" disabled={busy}>
                {busy ? <Spinner label="Procesando" /> : `Pagar ${formatMoney(amountCents, currency)}`}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function KindOption({
  active,
  onClick,
  title,
  price,
  currency,
  disabled,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  price: number;
  currency: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
        active
          ? 'border-brand-500 bg-brand-500/10'
          : 'border-ink-600 hover:border-brand-500/60'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <span>
        <span className="block text-sm font-semibold text-cloud-100">{title}</span>
        {hint && <span className="block text-xs text-cloud-400">{hint}</span>}
      </span>
      <span className="text-sm font-bold text-brand-200">{formatMoney(price, currency)}</span>
    </button>
  );
}
