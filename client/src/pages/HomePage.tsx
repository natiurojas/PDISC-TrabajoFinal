import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { formatRuntime } from '../lib/format';
import { ErrorState, PageLoader, ScoreBadge } from '../components/ui';
import { MovieGrid } from '../components/movies/MovieGrid';
import { PlayIcon, TrendingIcon } from '../components/icons';
import type { Movie } from '../types';

function Hero({ movie }: { movie: Movie }) {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        {movie.backdropUrl ? (
          <img
            src={movie.backdropUrl}
            alt=""
            className="h-full w-full object-cover opacity-40"
            loading="eager"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-ink-800 to-ink-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/80 to-ink-900/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-900 via-ink-900/60 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="max-w-2xl">
          <span className="badge-mint">
            <TrendingIcon width={13} height={13} /> Destacada de la semana
          </span>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {movie.title}
          </h1>

          {movie.tagline && (
            <p className="mt-3 text-lg text-brand-300 italic">{movie.tagline}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-cloud-300">
            <ScoreBadge score={movie.score} />
            <span>{movie.releaseYear ?? 's/f'}</span>
            <span aria-hidden="true">•</span>
            <span>{formatRuntime(movie.runtimeMinutes)}</span>
            {movie.ageRating && <span className="badge">{movie.ageRating}</span>}
          </div>

          <p className="mt-5 line-clamp-4 max-w-xl text-base text-cloud-200">{movie.synopsis}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={`/pelicula/${movie.slug}?reproducir=1`} className="btn-primary px-6 py-3">
              <PlayIcon width={18} height={18} /> Reproducir
            </Link>
            <Link to={`/pelicula/${movie.slug}`} className="btn-ghost px-6 py-3">
              Mas informacion
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Section({
  title,
  subtitle,
  to,
  query,
  movies,
}: {
  title: string;
  subtitle?: string;
  to: string;
  query?: Record<string, string>;
  movies: Movie[];
}) {
  const href = query ? `${to}?${new URLSearchParams(query).toString()}` : to;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-cloud-400">{subtitle}</p>}
        </div>
        <Link to={href} className="link text-sm font-semibold">
          Ver todo
        </Link>
      </div>
      <MovieGrid movies={movies} />
    </section>
  );
}

export function HomePage() {
  const featured = useAsync((signal) => api.movies.list({ featured: true, limit: 8 }, signal), []);
  const topRated = useAsync(
    (signal) => api.movies.list({ sort: 'score', order: 'desc', limit: 10 }, signal),
    [],
  );
  const recent = useAsync(
    (signal) => api.movies.list({ sort: 'year', order: 'desc', limit: 10 }, signal),
    [],
  );

  const loading = featured.status === 'loading' && !featured.data;
  const error = featured.error ?? topRated.error ?? recent.error;

  if (loading) return <PageLoader label="Cargando el catalogo" />;

  if (error && !featured.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState message={error} onRetry={featured.reload} />
      </div>
    );
  }

  const heroMovie = featured.data?.items[0];

  return (
    <div className="pb-8">
      {heroMovie && <Hero movie={heroMovie} />}

      {featured.data && featured.data.items.length > 1 && (
        <Section
          title="Destacadas"
          subtitle="Seleccionadas por el equipo de Pelipop"
          to="/catalogo"
          query={{ featured: 'true' }}
          movies={featured.data.items.slice(1)}
        />
      )}

      {topRated.data && (
        <Section
          title="Mejor valoradas"
          subtitle="Las puntuaciones mas altas del catalogo"
          to="/catalogo"
          query={{ sort: 'score' }}
          movies={topRated.data.items}
        />
      )}

      {recent.data && (
        <Section
          title="Recien anadidas"
          subtitle="Los estrenos mas recientes"
          to="/catalogo"
          query={{ sort: 'year' }}
          movies={recent.data.items}
        />
      )}
    </div>
  );
}
