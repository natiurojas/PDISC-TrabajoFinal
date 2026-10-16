import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, errorMessage } from '../../lib/api';
import { useAsync } from '../../hooks/useAsync';
import { Alert, ErrorState, PageLoader } from '../../components/ui';
import { ArrowLeftIcon, RefreshIcon } from '../../components/icons';
import type { MoviePayload, MovieSource } from '../../types';

interface FormState {
  title: string;
  slug: string;
  originalTitle: string;
  tagline: string;
  synopsis: string;
  releaseDate: string;
  runtimeMinutes: string;
  ageRating: string;
  score: string;
  popularity: string;
  videoSource: MovieSource;
  videoUrl: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string;
  featured: boolean;
  genres: string[];
}

const AGE_RATINGS = ['', 'TP', '7', '12', '16', '18'];

const emptyForm: FormState = {
  title: '',
  slug: '',
  originalTitle: '',
  tagline: '',
  synopsis: '',
  releaseDate: '',
  runtimeMinutes: '',
  ageRating: '12',
  score: '7',
  popularity: '0',
  videoSource: 'remote',
  videoUrl: '',
  posterUrl: '',
  backdropUrl: '',
  trailerUrl: '',
  featured: false,
  genres: [],
};

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function toNumeric(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function MovieFormPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(slug);

  const existing = useAsync(
    (signal) => (isEdit ? api.movies.get(slug as string, signal) : Promise.resolve(null)),
    [slug],
  );
  const facets = useAsync((signal) => api.facets(signal), []);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Rellena el formulario cuando llega la pelicula a editar.
  useEffect(() => {
    const movie = existing.data;
    if (!movie) return;

    setForm({
      title: movie.title,
      slug: movie.slug,
      originalTitle: movie.originalTitle ?? '',
      tagline: movie.tagline ?? '',
      synopsis: movie.synopsis,
      releaseDate: movie.releaseDate ?? '',
      runtimeMinutes: movie.runtimeMinutes ? String(movie.runtimeMinutes) : '',
      ageRating: movie.ageRating ?? '',
      score: String(movie.score),
      popularity: String(movie.popularity),
      videoSource: movie.videoSource,
      videoUrl: movie.videoUrl,
      posterUrl: movie.posterUrl ?? '',
      backdropUrl: movie.backdropUrl ?? '',
      trailerUrl: movie.trailerUrl ?? '',
      featured: movie.featured,
      genres: movie.genres.map((genre) => genre.slug),
    });
  }, [existing.data]);

  const availableGenres = useMemo(() => facets.data?.genres ?? [], [facets.data]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function onTitleChange(value: string) {
    setForm((previous) => ({
      ...previous,
      title: value,
      slug: slugTouched ? previous.slug : slugify(value),
    }));
  }

  function toggleGenre(genreSlug: string) {
    setForm((previous) => ({
      ...previous,
      genres: previous.genres.includes(genreSlug)
        ? previous.genres.filter((entry) => entry !== genreSlug)
        : [...previous.genres, genreSlug],
    }));
  }

  function suggestImages() {
    const seed = form.slug || slugify(form.title) || 'pelipop';
    setForm((previous) => ({
      ...previous,
      posterUrl: previous.posterUrl || `https://picsum.photos/seed/pelipop-${seed}/500/750`,
      backdropUrl:
        previous.backdropUrl || `https://picsum.photos/seed/pelipop-${seed}-backdrop/1600/900`,
    }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (form.title.trim().length < 1) {
      setError('El titulo es obligatorio.');
      return;
    }
    if (form.synopsis.trim().length < 10) {
      setError('Escribe una sinopsis de al menos 10 caracteres.');
      return;
    }
    if (!form.videoUrl.trim()) {
      setError('Indica la fuente del video (URL remota o archivo local).');
      return;
    }
    if (form.videoSource === 'remote' && !/^https?:\/\//i.test(form.videoUrl.trim())) {
      setError('Con fuente remota, la URL debe empezar por http:// o https://');
      return;
    }

    const payload: MoviePayload = {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      originalTitle: form.originalTitle.trim() || undefined,
      tagline: form.tagline.trim() || undefined,
      synopsis: form.synopsis.trim(),
      releaseDate: form.releaseDate || undefined,
      runtimeMinutes: toNumeric(form.runtimeMinutes),
      ageRating: form.ageRating || undefined,
      score: toNumeric(form.score) ?? 0,
      popularity: toNumeric(form.popularity) ?? 0,
      posterUrl: form.posterUrl.trim() || undefined,
      backdropUrl: form.backdropUrl.trim() || undefined,
      videoSource: form.videoSource,
      videoUrl: form.videoUrl.trim(),
      trailerUrl: form.trailerUrl.trim() || undefined,
      featured: form.featured,
      genres: form.genres,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await api.admin.updateMovie(slug as string, payload);
      } else {
        await api.admin.createMovie(payload);
      }
      navigate('/admin/peliculas', { replace: true });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  if (isEdit && existing.status === 'loading' && !existing.data) {
    return <PageLoader label="Cargando la pelicula" />;
  }

  if (isEdit && existing.status === 'error') {
    return <ErrorState message={existing.error ?? 'No se pudo cargar la pelicula'} onRetry={existing.reload} />;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to="/admin/peliculas"
        className="inline-flex items-center gap-2 text-sm text-cloud-300 transition hover:text-brand-300"
      >
        <ArrowLeftIcon width={16} height={16} /> Volver al catalogo
      </Link>

      <h2 className="mt-4 text-2xl font-bold tracking-tight">
        {isEdit ? 'Editar pelicula' : 'Nueva pelicula'}
      </h2>
      <p className="mt-1 text-sm text-cloud-400">
        Los campos marcados con <span className="text-brand-300">*</span> son obligatorios.
      </p>

      {error && (
        <div className="mt-5">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-6" noValidate>
        <section className="card p-6">
          <h3 className="text-sm font-bold tracking-wide text-cloud-200 uppercase">Informacion</h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="title" className="label">
                Titulo <span className="text-brand-300">*</span>
              </label>
              <input
                id="title"
                value={form.title}
                onChange={(event) => onTitleChange(event.target.value)}
                className="input"
                required
              />
            </div>

            <div>
              <label htmlFor="slug" className="label">
                Slug (URL)
              </label>
              <input
                id="slug"
                value={form.slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  update('slug', event.target.value);
                }}
                className="input font-mono text-xs"
                placeholder="se-genera-del-titulo"
              />
            </div>

            <div>
              <label htmlFor="originalTitle" className="label">
                Titulo original
              </label>
              <input
                id="originalTitle"
                value={form.originalTitle}
                onChange={(event) => update('originalTitle', event.target.value)}
                className="input"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="tagline" className="label">
                Tagline
              </label>
              <input
                id="tagline"
                value={form.tagline}
                onChange={(event) => update('tagline', event.target.value)}
                className="input"
                placeholder="Una frase corta que resuma la pelicula"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="synopsis" className="label">
                Sinopsis <span className="text-brand-300">*</span>
              </label>
              <textarea
                id="synopsis"
                value={form.synopsis}
                onChange={(event) => update('synopsis', event.target.value)}
                rows={4}
                className="input resize-y"
                required
              />
            </div>
          </div>
        </section>

        <section className="card p-6">
          <h3 className="text-sm font-bold tracking-wide text-cloud-200 uppercase">
            Datos y clasificacion
          </h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="releaseDate" className="label">
                Fecha de estreno
              </label>
              <input
                id="releaseDate"
                type="date"
                value={form.releaseDate}
                onChange={(event) => update('releaseDate', event.target.value)}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="runtimeMinutes" className="label">
                Duracion (min)
              </label>
              <input
                id="runtimeMinutes"
                type="number"
                min={1}
                max={900}
                value={form.runtimeMinutes}
                onChange={(event) => update('runtimeMinutes', event.target.value)}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="ageRating" className="label">
                Clasificacion
              </label>
              <select
                id="ageRating"
                value={form.ageRating}
                onChange={(event) => update('ageRating', event.target.value)}
                className="input"
              >
                {AGE_RATINGS.map((rating) => (
                  <option key={rating || 'none'} value={rating}>
                    {rating || 'Sin clasificar'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="score" className="label">
                Nota (0-10)
              </label>
              <input
                id="score"
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={form.score}
                onChange={(event) => update('score', event.target.value)}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="popularity" className="label">
                Popularidad (0-1000)
              </label>
              <input
                id="popularity"
                type="number"
                min={0}
                max={1000}
                value={form.popularity}
                onChange={(event) => update('popularity', event.target.value)}
                className="input"
              />
            </div>

            <label className="flex items-center gap-2 self-end pb-2 text-sm text-cloud-200">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) => update('featured', event.target.checked)}
                className="h-4 w-4 accent-brand-500"
              />
              Pelicula destacada
            </label>
          </div>

          <div className="mt-5">
            <p className="label">Generos</p>
            <div className="flex flex-wrap gap-2">
              {availableGenres.map((genre) => {
                const active = form.genres.includes(genre.slug);
                return (
                  <button
                    key={genre.slug}
                    type="button"
                    onClick={() => toggleGenre(genre.slug)}
                    aria-pressed={active}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      active
                        ? 'border-brand-500 bg-brand-500/15 text-brand-200'
                        : 'border-ink-600 text-cloud-300 hover:border-brand-500/60'
                    }`}
                  >
                    {genre.name}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-cloud-400">
              Si escribes un genero nuevo desde la API, se creara automaticamente. Aplica al guardar.
            </p>
          </div>
        </section>

        <section className="card p-6">
          <h3 className="text-sm font-bold tracking-wide text-cloud-200 uppercase">Video</h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="videoSource" className="label">
                Tipo de fuente
              </label>
              <select
                id="videoSource"
                value={form.videoSource}
                onChange={(event) => update('videoSource', event.target.value as MovieSource)}
                className="input"
              >
                <option value="remote">Remota (URL http)</option>
                <option value="local">Local (archivo en data/videos)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="videoUrl" className="label">
                Fuente <span className="text-brand-300">*</span>
              </label>
              <input
                id="videoUrl"
                value={form.videoUrl}
                onChange={(event) => update('videoUrl', event.target.value)}
                className="input"
                placeholder={
                  form.videoSource === 'remote'
                    ? 'https://cdn.ejemplo.com/pelicula.mp4'
                    : 'pelicula.mp4'
                }
                required
              />
              <p className="mt-1.5 text-xs text-cloud-400">
                {form.videoSource === 'remote'
                  ? 'Se hace proxy desde el backend respetando las peticiones Range.'
                  : 'Ruta relativa dentro de VIDEOS_DIR; no se expone la ruta real del disco.'}
              </p>
            </div>
          </div>
        </section>

        <section className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold tracking-wide text-cloud-200 uppercase">Imagenes</h3>
            <button type="button" className="btn-ghost btn-sm" onClick={suggestImages}>
              <RefreshIcon width={14} height={14} /> Sugerir imagenes
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="posterUrl" className="label">
                Poster (2:3)
              </label>
              <input
                id="posterUrl"
                value={form.posterUrl}
                onChange={(event) => update('posterUrl', event.target.value)}
                className="input"
                placeholder="https://..."
              />
            </div>
            <div>
              <label htmlFor="backdropUrl" className="label">
                Fondo (16:9)
              </label>
              <input
                id="backdropUrl"
                value={form.backdropUrl}
                onChange={(event) => update('backdropUrl', event.target.value)}
                className="input"
                placeholder="https://..."
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="trailerUrl" className="label">
                Trailer
              </label>
              <input
                id="trailerUrl"
                value={form.trailerUrl}
                onChange={(event) => update('trailerUrl', event.target.value)}
                className="input"
                placeholder="https://..."
              />
            </div>
          </div>

          {(form.posterUrl || form.backdropUrl) && (
            <div className="mt-5 flex flex-wrap gap-4">
              {form.posterUrl && (
                <img
                  src={form.posterUrl}
                  alt="Vista previa del poster"
                  className="h-40 w-28 rounded-lg border border-ink-600 object-cover"
                />
              )}
              {form.backdropUrl && (
                <img
                  src={form.backdropUrl}
                  alt="Vista previa del fondo"
                  className="h-40 flex-1 rounded-lg border border-ink-600 object-cover"
                />
              )}
            </div>
          )}
        </section>

        <div className="flex flex-wrap justify-end gap-3">
          <Link to="/admin/peliculas" className="btn-ghost">
            Cancelar
          </Link>
          <button type="submit" className="btn-primary px-6" disabled={saving}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear pelicula'}
          </button>
        </div>
      </form>
    </div>
  );
}
