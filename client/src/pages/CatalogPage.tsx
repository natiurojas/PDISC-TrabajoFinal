import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAsync, useDebounced } from '../hooks/useAsync';
import { formatNumber, pluralize } from '../lib/format';
import {
  CatalogFilters,
  emptyFilters,
  FiltersSummary,
  toCatalogQuery,
  type FilterState,
} from '../components/filters/CatalogFilters';
import { MovieGrid, MovieGridSkeleton } from '../components/movies/MovieGrid';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/icons';
import { EmptyState, ErrorState } from '../components/ui';

const LIMIT = 24;

function filtersFromParams(params: URLSearchParams): FilterState {
  return {
    search: params.get('search') ?? '',
    genres: params.getAll('genre'),
    year: params.get('year') ?? '',
    sort: params.get('sort') ?? emptyFilters.sort,
    order: (params.get('order') as 'asc' | 'desc') ?? emptyFilters.order,
    minScore: params.get('minScore') ?? '',
    featured: params.get('featured') === 'true',
  };
}

function paramsFromFilters(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  for (const genre of filters.genres) params.append('genre', genre);
  if (filters.year) params.set('year', filters.year);
  if (filters.minScore) params.set('minScore', filters.minScore);
  if (filters.featured) params.set('featured', 'true');
  if (filters.sort !== emptyFilters.sort) params.set('sort', filters.sort);
  if (filters.order !== emptyFilters.order && filters.sort !== 'title') {
    params.set('order', filters.order);
  }
  return params;
}

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);

  const filters = useMemo(() => filtersFromParams(searchParams), [searchParams]);
  const debouncedSearch = useDebounced(filters.search, 400);

  const effectiveFilters = useMemo<FilterState>(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  );

  // Cualquier cambio de filtros vuelve a la primera pagina.
  useEffect(() => {
    setPage(1);
  }, [searchParams]);

  const facets = useAsync((signal) => api.facets(signal), []);

  const query = useMemo(() => toCatalogQuery(effectiveFilters, page, LIMIT), [effectiveFilters, page]);
  const movies = useAsync(
    (signal) => api.movies.list(query, signal),
    [JSON.stringify(query)],
  );

  const updateFilters = useCallback(
    (patch: Partial<FilterState>) => {
      const next = { ...filtersFromParams(searchParams), ...patch };
      setSearchParams(paramsFromFilters(next), { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const clearFilters = useCallback(() => setSearchParams(new URLSearchParams(), { replace: true }), [setSearchParams]);

  const totalPages = movies.data?.totalPages ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Catalogo</h1>
        <p className="mt-1 text-sm text-cloud-400">
          {movies.data
            ? `${formatNumber(movies.data.total)} ${pluralize(movies.data.total, 'pelicula', 'peliculas')} disponibles`
            : 'Explora, filtra y encuentra tu proxima pelicula'}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <CatalogFilters
          filters={filters}
          years={facets.data?.years ?? []}
          genres={facets.data?.genres ?? []}
          onChange={updateFilters}
          onClear={clearFilters}
        />

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <FiltersSummary filters={filters} />
            {movies.status === 'loading' && (
              <span className="text-xs text-cloud-400">Actualizando...</span>
            )}
          </div>

          {movies.status === 'error' && movies.error && (
            <ErrorState message={movies.error} onRetry={movies.reload} />
          )}

          {movies.status === 'loading' && !movies.data && <MovieGridSkeleton count={10} />}

          {movies.data && movies.data.items.length === 0 && (
            <EmptyState
              title="Sin resultados"
              message="No hay peliculas que encajen con esos filtros. Prueba a quitar alguno o busca otro titulo."
              action={
                <button type="button" className="btn-primary" onClick={clearFilters}>
                  Quitar filtros
                </button>
              }
            />
          )}

          {movies.data && movies.data.items.length > 0 && (
            <>
              <MovieGrid movies={movies.data.items} />

              {totalPages > 1 && (
                <nav
                  className="mt-8 flex items-center justify-center gap-4"
                  aria-label="Paginacion del catalogo"
                >
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => setPage((current) => Math.max(current - 1, 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeftIcon width={16} height={16} /> Anterior
                  </button>

                  <span className="text-sm text-cloud-300">
                    Pagina <span className="font-semibold text-cloud-100">{page}</span> de {totalPages}
                  </span>

                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                    disabled={page >= totalPages}
                  >
                    Siguiente <ChevronRightIcon width={16} height={16} />
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
