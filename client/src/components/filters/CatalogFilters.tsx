import type { CatalogQuery } from '../../types';

export interface FilterState {
  search: string;
  genres: string[];
  year: string;
  sort: string;
  order: 'asc' | 'desc';
  minScore: string;
  featured: boolean;
}

export const SORT_OPTIONS = [
  { value: 'popularity', label: 'Popularidad' },
  { value: 'score', label: 'Puntuacion' },
  { value: 'year', label: 'Anio de estreno' },
  { value: 'title', label: 'Titulo (A-Z)' },
  { value: 'runtime', label: 'Duracion' },
] as const;

export const emptyFilters: FilterState = {
  search: '',
  genres: [],
  year: '',
  sort: 'popularity',
  order: 'desc',
  minScore: '',
  featured: false,
};

export function toCatalogQuery(filters: FilterState, page: number, limit = 24): CatalogQuery {
  return {
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.genres.length > 0 ? { genre: filters.genres } : {}),
    ...(filters.year ? { year: Number(filters.year) } : {}),
    ...(filters.minScore ? { minScore: Number(filters.minScore) } : {}),
    ...(filters.featured ? { featured: true } : {}),
    sort: filters.sort as CatalogQuery['sort'],
    order: filters.sort === 'title' ? 'asc' : filters.order,
    page,
    limit,
  };
}

export function FiltersSummary({ filters }: { filters: FilterState }) {
  const chips: string[] = [];

  if (filters.search) chips.push(`"${filters.search}"`);
  if (filters.featured) chips.push('Solo destacadas');
  if (filters.year) chips.push(`Anio ${filters.year}`);
  if (filters.minScore) chips.push(`Nota >= ${filters.minScore}`);
  if (filters.genres.length > 0) chips.push(filters.genres.join(', '));

  if (chips.length === 0) return null;

  return (
    <p className="text-sm text-cloud-400">
      Filtros activos: <span className="text-cloud-200">{chips.join(' · ')}</span>
    </p>
  );
}

export function CatalogFilters({
  filters,
  years,
  genres,
  onChange,
  onClear,
}: {
  filters: FilterState;
  years: Array<{ year: number; movieCount: number }>;
  genres: Array<{ name: string; slug: string; movieCount: number }>;
  onChange: (patch: Partial<FilterState>) => void;
  onClear: () => void;
}) {
  function toggleGenre(slug: string) {
    const next = filters.genres.includes(slug)
      ? filters.genres.filter((entry) => entry !== slug)
      : [...filters.genres, slug];
    onChange({ genres: next });
  }

  return (
    <aside className="card h-fit p-5 lg:sticky lg:top-20">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-wide text-cloud-200 uppercase">Filtros</h2>
        <button type="button" onClick={onClear} className="text-xs text-brand-300 hover:underline">
          Limpiar
        </button>
      </div>

      <div className="mt-5">
        <label className="label" htmlFor="filtro-search">
          Buscar
        </label>
        <input
          id="filtro-search"
          type="search"
          value={filters.search}
          onChange={(event) => onChange({ search: event.target.value })}
          placeholder="Titulo o sinopsis"
          className="input"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="filtro-year">
            Anio
          </label>
          <select
            id="filtro-year"
            value={filters.year}
            onChange={(event) => onChange({ year: event.target.value })}
            className="input"
          >
            <option value="">Todos</option>
            {years.map((entry) => (
              <option key={entry.year} value={entry.year}>
                {entry.year} ({entry.movieCount})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="filtro-score">
            Nota minima
          </label>
          <select
            id="filtro-score"
            value={filters.minScore}
            onChange={(event) => onChange({ minScore: event.target.value })}
            className="input"
          >
            <option value="">Cualquiera</option>
            {[6, 7, 8, 9].map((value) => (
              <option key={value} value={value}>
                {value}+
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="filtro-sort">
            Ordenar por
          </label>
          <select
            id="filtro-sort"
            value={filters.sort}
            onChange={(event) => onChange({ sort: event.target.value })}
            className="input"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="filtro-order">
            Direccion
          </label>
          <select
            id="filtro-order"
            value={filters.order}
            onChange={(event) => onChange({ order: event.target.value as 'asc' | 'desc' })}
            disabled={filters.sort === 'title'}
            className="input disabled:opacity-50"
          >
            <option value="desc">Descendente</option>
            <option value="asc">Ascendente</option>
          </select>
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-cloud-200">
        <input
          type="checkbox"
          checked={filters.featured}
          onChange={(event) => onChange({ featured: event.target.checked })}
          className="h-4 w-4 accent-brand-500"
        />
        Solo destacadas
      </label>

      <div className="mt-5">
        <p className="label">Generos</p>
        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => {
            const active = filters.genres.includes(genre.slug);
            return (
              <button
                key={genre.slug}
                type="button"
                onClick={() => toggleGenre(genre.slug)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  active
                    ? 'border-brand-500 bg-brand-500/15 text-brand-200'
                    : 'border-ink-600 text-cloud-300 hover:border-brand-500/60 hover:text-cloud-100'
                }`}
              >
                {genre.name}
                <span className="ml-1 text-cloud-400">{genre.movieCount}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
