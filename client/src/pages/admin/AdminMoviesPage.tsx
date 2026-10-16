import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, errorMessage } from '../../lib/api';
import { useAsync, useDebounced } from '../../hooks/useAsync';
import { formatNumber } from '../../lib/format';
import { ConfirmDialog, ErrorState, Spinner } from '../../components/ui';
import { MovieGridSkeleton } from '../../components/movies/MovieGrid';
import { PencilIcon, PlusIcon, SearchIcon, StarIcon, TrashIcon } from '../../components/icons';
import type { CatalogQuery, Movie } from '../../types';

export function AdminMoviesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<Movie | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const debounced = useDebounced(search, 350);

  const query = useMemo<CatalogQuery>(
    () => ({ search: debounced || undefined, page, limit: 20, sort: 'year', order: 'desc' }),
    [debounced, page],
  );

  const movies = useAsync((signal) => api.movies.list(query, signal), [JSON.stringify(query)]);

  function reload() {
    movies.reload();
  }

  async function toggleFeatured(movie: Movie) {
    setBusyId(movie.id);
    setFeedback(null);
    try {
      await api.admin.setFeatured(movie.id, !movie.featured);
      setFeedback({
        tone: 'success',
        message: `"${movie.title}" ${movie.featured ? 'ya no esta destacada' : 'ahora esta destacada'}.`,
      });
      reload();
    } catch (error) {
      setFeedback({ tone: 'error', message: errorMessage(error) });
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;

    setDeleting(true);
    try {
      const response = await api.admin.deleteMovie(pendingDelete.id);
      setFeedback({ tone: 'success', message: response.message });
      setPendingDelete(null);
      reload();
    } catch (error) {
      setFeedback({ tone: 'error', message: errorMessage(error) });
    } finally {
      setDeleting(false);
    }
  }

  const totalPages = movies.data?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Catalogo</h2>
          <p className="text-sm text-cloud-400">
            {movies.data ? `${formatNumber(movies.data.total)} peliculas registradas` : 'Cargando...'}
          </p>
        </div>

        <div className="flex w-full gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-cloud-400"
              width={16}
              height={16}
            />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
                setSearchParams(event.target.value ? { search: event.target.value } : {}, {
                  replace: true,
                });
              }}
              placeholder="Buscar por titulo o sinopsis"
              aria-label="Buscar peliculas"
              className="input pl-9"
            />
          </div>

          <Link to="/admin/peliculas/nueva" className="btn-primary shrink-0">
            <PlusIcon width={16} height={16} /> Nueva
          </Link>
        </div>
      </div>

      {feedback && (
        <p
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.tone === 'success'
              ? 'border-mint-500/40 bg-mint-500/10 text-mint-200'
              : 'border-red-500/40 bg-red-500/10 text-red-200'
          }`}
        >
          {feedback.message}
        </p>
      )}

      {movies.status === 'error' && movies.error && (
        <ErrorState message={movies.error} onRetry={reload} />
      )}

      {movies.status === 'loading' && !movies.data && <MovieGridSkeleton count={5} />}

      {movies.data && movies.data.items.length === 0 && (
        <div className="card border-dashed p-10 text-center">
          <p className="text-sm text-cloud-300">
            No hay peliculas que coincidan con la busqueda.
          </p>
        </div>
      )}

      {movies.data && movies.data.items.length > 0 && (
        <div className="card overflow-hidden">
          {/* Tabla en pantallas grandes */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink-950/50 text-xs tracking-wide text-cloud-400 uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3">Pelicula</th>
                  <th scope="col" className="px-4 py-3">Anio</th>
                  <th scope="col" className="px-4 py-3">Generos</th>
                  <th scope="col" className="px-4 py-3">Nota</th>
                  <th scope="col" className="px-4 py-3">Fuente</th>
                  <th scope="col" className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700">
                {movies.data.items.map((movie) => (
                  <tr key={movie.id} className="transition hover:bg-ink-700/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-8 shrink-0 overflow-hidden rounded bg-ink-700">
                          {movie.posterUrl && (
                            <img src={movie.posterUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-1 font-semibold">{movie.title}</p>
                          <p className="line-clamp-1 text-xs text-cloud-400">/{movie.slug}</p>
                        </div>
                        {movie.featured && <span className="badge-mint ml-1">dest.</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-cloud-300">{movie.releaseYear ?? '—'}</td>
                    <td className="px-4 py-3 text-cloud-300">
                      {movie.genres.map((genre) => genre.name).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-mint-300">{movie.score.toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <span className="badge">{movie.videoSource}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void toggleFeatured(movie)}
                          disabled={busyId === movie.id}
                          className="btn-ghost btn-sm"
                          title={movie.featured ? 'Quitar de destacadas' : 'Marcar como destacada'}
                        >
                          <StarIcon
                            width={14}
                            height={14}
                            className={movie.featured ? 'text-mint-300' : ''}
                          />
                        </button>
                        <Link to={`/admin/peliculas/${movie.slug}/editar`} className="btn-ghost btn-sm">
                          <PencilIcon width={14} height={14} /> Editar
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(movie)}
                          className="btn-danger btn-sm"
                        >
                          <TrashIcon width={14} height={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tarjetas en movil */}
          <ul className="divide-y divide-ink-700 lg:hidden">
            {movies.data.items.map((movie) => (
              <li key={movie.id} className="p-4">
                <div className="flex gap-3">
                  <div className="h-20 w-14 shrink-0 overflow-hidden rounded bg-ink-700">
                    {movie.posterUrl && (
                      <img src={movie.posterUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 font-semibold">{movie.title}</p>
                    <p className="text-xs text-cloud-400">
                      {movie.releaseYear ?? 's/f'} · nota {movie.score.toFixed(1)}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-cloud-400">
                      {movie.genres.map((genre) => genre.name).join(', ')}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Link to={`/admin/peliculas/${movie.slug}/editar`} className="btn-ghost btn-sm">
                        <PencilIcon width={13} height={13} /> Editar
                      </Link>
                      <button
                        type="button"
                        className="btn-danger btn-sm"
                        onClick={() => setPendingDelete(movie)}
                      >
                        <TrashIcon width={13} height={13} /> Borrar
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            disabled={page <= 1}
          >
            Anterior
          </button>
          <span className="text-sm text-cloud-300">
            Pagina {page} de {totalPages}
          </span>
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
            disabled={page >= totalPages}
          >
            Siguiente
          </button>
        </div>
      )}

      {movies.status === 'loading' && movies.data && (
        <div className="flex justify-center">
          <Spinner label="Actualizando" />
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminar pelicula"
        message={`Se borrara "${pendingDelete?.title ?? ''}" del catalogo junto con sus relaciones de genero. Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
