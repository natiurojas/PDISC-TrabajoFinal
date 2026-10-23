import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { formatDate, formatDateTime, formatMoney, formatRuntime, formatScore } from '../lib/format';
import { useAuth } from '../auth/AuthContext';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { MovieCard } from '../components/movies/MovieCard';
import { ErrorState, PageLoader } from '../components/ui';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  LockIcon,
  PlayIcon,
  ShoppingBagIcon,
  TagIcon,
  TicketIcon,
} from '../components/icons';

export function MovieDetailPage() {
  const { slug = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [playing, setPlaying] = useState(searchParams.get('reproducir') === '1');
  const playerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const movie = useAsync((signal) => api.movies.get(slug, signal), [slug]);
  const similar = useAsync((signal) => api.movies.similar(slug, 5, signal), [slug]);
  const access = useAsync(
    (signal) => (user ? api.payments.access(slug, signal) : Promise.resolve(null)),
    [slug, user?.id],
  );

  useEffect(() => {
    setPlaying(searchParams.get('reproducir') === '1');
  }, [searchParams]);

  function startPlaying() {
    if (movie.status === 'success') {
      const data = movie.data;
      const owned = access.data?.entitlement.owned ?? false;
      if (!owned && !data) return;
      if (!owned) return;
    } else {
      return;
    }
    setPlaying(true);
    setSearchParams({ reproducir: '1' }, { replace: true });
    window.setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
  }

  if (movie.status === 'loading' && !movie.data) return <PageLoader label="Cargando la ficha" />;

  if (movie.status === 'error' || !movie.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState
          title="No encontramos esa pelicula"
          message={movie.error ?? 'La pelicula solicitada no existe o fue eliminada.'}
          onRetry={movie.reload}
        />
        <div className="mt-6 text-center">
          <Link to="/catalogo" className="btn-ghost">
            <ArrowLeftIcon width={16} height={16} /> Volver al catalogo
          </Link>
        </div>
      </div>
    );
  }

  const data = movie.data;
  const accessData = access.data;
  const owned = accessData?.entitlement.owned ?? false;
  const free = accessData?.free ?? false;
  const canPlay = owned || free;
  const streamUrl = accessData?.streamUrl ?? data.streamUrl;
  const currency = accessData?.prices.currency ?? 'EUR';
  const rentHours = accessData?.rentDurationHours ?? 48;

  const isRentOwned =
    owned && accessData?.entitlement.kind === 'rent' && accessData.entitlement.source === 'purchase';
  const expiryText = isRentOwned && accessData?.entitlement.expiresAt
    ? formatDateTime(accessData.entitlement.expiresAt)
    : null;

  return (
    <article className="pb-12">
      <div className="relative isolate">
        <div className="absolute inset-0 -z-10 h-72 overflow-hidden sm:h-96">
          {data.backdropUrl && (
            <img src={data.backdropUrl} alt="" className="h-full w-full object-cover opacity-30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/85 to-ink-900/50" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 text-sm text-cloud-300 transition hover:text-brand-300"
          >
            <ArrowLeftIcon width={16} height={16} /> Catalogo
          </Link>

          <div className="mt-6 grid gap-8 md:grid-cols-[260px_1fr]">
            <div className="mx-auto w-48 overflow-hidden rounded-card border border-ink-700 shadow-2xl sm:w-56 md:mx-0 md:w-full">
              {data.posterUrl ? (
                <img
                  src={data.posterUrl}
                  alt={`Poster de ${data.title}`}
                  className="aspect-[2/3] w-full object-cover"
                />
              ) : (
                <div className="grid aspect-[2/3] w-full place-items-center bg-ink-800 text-center text-sm text-cloud-400">
                  Sin poster
                </div>
              )}
            </div>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{data.title}</h1>

              {data.originalTitle && data.originalTitle !== data.title && (
                <p className="mt-1 text-sm text-cloud-400 italic">{data.originalTitle}</p>
              )}

              {data.tagline && <p className="mt-3 text-lg text-brand-300 italic">{data.tagline}</p>}

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-cloud-300">
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-mint-400">★</span>
                  <span className="font-semibold text-mint-300">{formatScore(data.score)}</span>
                  <span className="text-cloud-400">/ 10</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarIcon width={15} height={15} className="text-cloud-400" />
                  {formatDate(data.releaseDate)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ClockIcon width={15} height={15} className="text-cloud-400" />
                  {formatRuntime(data.runtimeMinutes)}
                </span>
                {data.ageRating && <span className="badge">Clasificacion {data.ageRating}</span>}
                {data.videoSource === 'local' && <span className="badge-mint">Archivo local</span>}
                {free && <span className="badge-mint">Gratis</span>}
                {isRentOwned && expiryText && <span className="badge-brand">Alquiler hasta {expiryText}</span>}
                {owned && accessData?.entitlement.kind === 'buy' && (
                  <span className="badge-brand">Compra permanente</span>
                )}
                {owned && accessData?.entitlement.source === 'staff' && (
                  <span className="badge">Acceso equipo</span>
                )}
              </div>

              {data.genres.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <TagIcon width={15} height={15} className="text-cloud-400" />
                  {data.genres.map((genre) => (
                    <Link
                      key={genre.id}
                      to={`/catalogo?genre=${encodeURIComponent(genre.slug)}`}
                      className="badge transition hover:border-brand-500 hover:text-brand-200"
                    >
                      {genre.name}
                    </Link>
                  ))}
                </div>
              )}

              <p className="mt-5 max-w-3xl leading-relaxed text-cloud-200">{data.synopsis}</p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                {canPlay ? (
                  <button type="button" onClick={startPlaying} className="btn-primary px-6 py-3">
                    <PlayIcon width={18} height={18} /> Reproducir
                  </button>
                ) : user ? (
                  <>
                    {(accessData?.prices.rentCents ?? 0) > 0 && (
                      <Link to={`/pago/${data.slug}?kind=rent`} className="btn-primary px-6 py-3">
                        <TicketIcon width={18} height={18} /> Alquilar ·{' '}
                        {formatMoney(accessData?.prices.rentCents ?? 0, currency)} · {rentHours} h
                      </Link>
                    )}
                    {(accessData?.prices.buyCents ?? 0) > 0 && (
                      <Link to={`/pago/${data.slug}?kind=buy`} className="btn-ghost px-6 py-3">
                        <ShoppingBagIcon width={18} height={18} /> Comprar ·{' '}
                        {formatMoney(accessData?.prices.buyCents ?? 0, currency)}
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link to={`/login?next=${encodeURIComponent(`/pago/${data.slug}?kind=rent`)}`} className="btn-primary px-6 py-3">
                      <PlayIcon width={18} height={18} /> Iniciar sesion para ver
                    </Link>
                    <Link to={`/registro`} className="btn-ghost px-6 py-3">
                      Crear cuenta
                    </Link>
                  </>
                )}
                <Link to={`/catalogo?genre=${encodeURIComponent(data.genres[0]?.slug ?? '')}`} className="btn-ghost px-6 py-3">
                  Generos similares
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div ref={playerRef} className="mx-auto mt-12 max-w-7xl px-4 sm:px-6">
        {canPlay && playing ? (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold">Reproductor</h2>
              <span className="text-xs text-cloud-400">
                Atajos: espacio (play/pausa) · flechas (avanzar) · m (silencio) · f (pantalla completa)
              </span>
            </div>
            <VideoPlayer movie={data} src={streamUrl} />
          </>
        ) : canPlay ? (
          <div className="card flex flex-col items-center gap-3 p-10 text-center">
            <PlayIcon width={30} height={30} className="text-brand-400" />
            <h2 className="text-lg font-semibold">Listo para ver</h2>
            <p className="max-w-md text-sm text-cloud-400">
              Pulsa reproducir para cargar el reproductor con tu token de acceso.
            </p>
            <button type="button" onClick={startPlaying} className="btn-accent mt-2">
              Cargar reproductor
            </button>
          </div>
        ) : user ? (
          <div className="card flex flex-col items-center gap-3 p-10 text-center">
            <LockIcon width={28} height={28} className="text-brand-400" />
            <h2 className="text-lg font-semibold">Alquila o compra para ver esta pelicula</h2>
            <p className="max-w-lg text-sm text-cloud-400">
              Selecciona una opcion arriba. El pago es simulado y el acceso queda vinculado a tu cuenta.
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              {(accessData?.prices.rentCents ?? 0) > 0 && (
                <Link to={`/pago/${data.slug}?kind=rent`} className="btn-primary px-6">
                  <TicketIcon width={16} height={16} /> Alquilar {formatMoney(accessData?.prices.rentCents ?? 0, currency)} · {rentHours} h
                </Link>
              )}
              {(accessData?.prices.buyCents ?? 0) > 0 && (
                <Link to={`/pago/${data.slug}?kind=buy`} className="btn-ghost px-6">
                  <ShoppingBagIcon width={16} height={16} /> Comprar {formatMoney(accessData?.prices.buyCents ?? 0, currency)}
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="card flex flex-col items-center gap-3 p-10 text-center">
            <LockIcon width={28} height={28} className="text-brand-400" />
            <h2 className="text-lg font-semibold">Inicia sesion para ver</h2>
            <p className="max-w-md text-sm text-cloud-400">
              Necesitas una cuenta para alquilar o comprar y reproducir el contenido.
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <Link to={`/login?next=${encodeURIComponent(`/pago/${data.slug}?kind=rent`)}`} className="btn-primary px-6">
                Iniciar sesion
              </Link>
              <Link to={`/registro`} className="btn-ghost px-6">
                Crear cuenta
              </Link>
            </div>
          </div>
        )}
      </div>

      {similar.data && similar.data.items.length > 0 && (
        <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6">
          <h2 className="mb-5 text-2xl font-bold tracking-tight">Tambien te puede gustar</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {similar.data.items.map((item) => (
              <MovieCard key={item.id} movie={item} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
