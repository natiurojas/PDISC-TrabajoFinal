import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAsync } from '../../hooks/useAsync';
import { formatNumber, formatScore } from '../../lib/format';
import { ErrorState, PageLoader, ScoreBadge } from '../../components/ui';
import { FilmIcon, StarIcon, TagIcon, TrendingIcon, UsersIcon } from '../../components/icons';
import type { ReactNode } from 'react';

function StatCard({
  label,
  value,
  hint,
  icon,
  accent = 'brand',
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  accent?: 'brand' | 'mint';
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-cloud-400 uppercase">{label}</p>
        <span
          className={`grid h-9 w-9 place-items-center rounded-lg ${
            accent === 'brand' ? 'bg-brand-500/15 text-brand-300' : 'bg-mint-500/15 text-mint-300'
          }`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-cloud-400">{hint}</p>}
    </div>
  );
}

export function DashboardPage() {
  const stats = useAsync((signal) => api.admin.stats(signal), []);

  if (stats.status === 'loading' && !stats.data) return <PageLoader label="Calculando metricas" />;

  if (stats.status === 'error' || !stats.data) {
    return <ErrorState message={stats.error ?? 'No se pudieron cargar las metricas'} onRetry={stats.reload} />;
  }

  const { movies, users, genres, years, latest, topRated } = stats.data;
  const hours = Math.round(movies.totalRuntimeMinutes / 60);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Peliculas"
          value={formatNumber(movies.total)}
          hint={`${movies.featured} destacadas`}
          icon={<FilmIcon width={18} height={18} />}
        />
        <StatCard
          label="Puntuacion media"
          value={formatScore(movies.averageScore)}
          hint="Sobre 10"
          accent="mint"
          icon={<StarIcon width={16} height={16} />}
        />
        <StatCard
          label="Generos"
          value={formatNumber(genres.total)}
          hint={years.earliest && years.latest ? `Catalogo ${years.earliest} - ${years.latest}` : undefined}
          icon={<TagIcon width={18} height={18} />}
        />
        <StatCard
          label="Usuarios"
          value={formatNumber(users.total)}
          hint={users.byRole.map((entry) => `${entry.role}: ${entry.total}`).join(' · ')}
          accent="mint"
          icon={<UsersIcon width={18} height={18} />}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <TrendingIcon width={18} height={18} className="text-brand-400" /> Generos con mas titulos
          </h2>
          <ul className="mt-4 space-y-3">
            {genres.top.map((genre) => {
              const max = genres.top[0]?.total || 1;
              return (
                <li key={genre.slug}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-cloud-200">{genre.name}</span>
                    <span className="text-cloud-400">{genre.total}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-mint-500"
                      style={{ width: `${(genre.total / max) * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-bold">Datos del catalogo</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-ink-700 pb-3">
              <dt className="text-cloud-400">Duracion total</dt>
              <dd className="font-semibold">{formatNumber(hours)} horas</dd>
            </div>
            <div className="flex items-center justify-between border-b border-ink-700 pb-3">
              <dt className="text-cloud-400">Primer estreno</dt>
              <dd className="font-semibold">{years.earliest ?? '—'}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-ink-700 pb-3">
              <dt className="text-cloud-400">Ultimo estreno</dt>
              <dd className="font-semibold">{years.latest ?? '—'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-cloud-400">Peliculas destacadas</dt>
              <dd className="font-semibold">{movies.featured}</dd>
            </div>
          </dl>

          <Link to="/admin/peliculas/nueva" className="btn-primary mt-6 w-full">
            Anadir nueva pelicula
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {[
          { title: 'Ultimas incorporaciones', items: latest },
          { title: 'Mejor valoradas', items: topRated },
        ].map((block) => (
          <div key={block.title} className="card p-6">
            <h2 className="text-lg font-bold">{block.title}</h2>
            <ul className="mt-4 divide-y divide-ink-700">
              {block.items.map((movie) => (
                <li key={movie.id} className="flex items-center gap-3 py-3">
                  <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-ink-700">
                    {movie.posterUrl && (
                      <img
                        src={movie.posterUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/admin/peliculas/${movie.slug}/editar`}
                      className="line-clamp-1 text-sm font-semibold transition hover:text-brand-300"
                    >
                      {movie.title}
                    </Link>
                    <p className="text-xs text-cloud-400">
                      {movie.releaseYear ?? 's/f'} · {movie.genres.map((g) => g.name).join(', ')}
                    </p>
                  </div>
                  <ScoreBadge score={movie.score} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
