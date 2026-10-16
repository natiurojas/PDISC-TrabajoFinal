import { getDb } from './index.js';
import { ensureGenreBySlug } from './genresRepo.js';
import type { CatalogSort, Genre, Movie, MovieSource, Page, SortOrder } from './types.js';
import { ApiError } from '../lib/errors.js';

interface MovieRow {
  id: number;
  slug: string;
  title: string;
  original_title: string | null;
  tagline: string | null;
  synopsis: string;
  release_year: number | null;
  release_date: string | null;
  runtime_minutes: number | null;
  age_rating: string | null;
  score: number;
  popularity: number;
  poster_url: string | null;
  backdrop_url: string | null;
  video_source: MovieSource;
  video_url: string;
  trailer_url: string | null;
  featured: number;
}

export interface CatalogFilters {
  search?: string;
  /** Semantica OR: la pelicula debe pertenecer a al menos uno de estos generos. */
  genres: string[];
  year?: number;
  minScore?: number;
  featured?: boolean;
  sort: CatalogSort;
  order: SortOrder;
  page: number;
  limit: number;
}

const COLUMNS = `
  m.id, m.slug, m.title, m.original_title, m.tagline, m.synopsis,
  m.release_year, m.release_date, m.runtime_minutes, m.age_rating,
  m.score, m.popularity, m.poster_url, m.backdrop_url,
  m.video_source, m.video_url, m.trailer_url, m.featured
`;

const SORT_COLUMNS: Record<CatalogSort, string> = {
  popularity: 'm.popularity',
  score: 'm.score',
  year: 'm.release_year',
  title: 'm.title COLLATE NOCASE',
  runtime: 'm.runtime_minutes',
};

function toMovie(row: MovieRow, genres: Genre[]): Movie {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    originalTitle: row.original_title,
    tagline: row.tagline,
    synopsis: row.synopsis,
    releaseYear: row.release_year,
    releaseDate: row.release_date,
    runtimeMinutes: row.runtime_minutes,
    ageRating: row.age_rating,
    score: row.score,
    popularity: row.popularity,
    posterUrl: row.poster_url,
    backdropUrl: row.backdrop_url,
    videoSource: row.video_source,
    videoUrl: row.video_url,
    streamUrl: `/api/movies/${row.id}/stream`,
    trailerUrl: row.trailer_url,
    featured: row.featured === 1,
    genres,
  };
}

/** Generos de varias peliculas en una sola consulta (evita N+1). */
function genresForMovies(ids: number[]): Map<number, Genre[]> {
  const grouped = new Map<number, Genre[]>();
  if (ids.length === 0) return grouped;

  const placeholders = ids.map(() => '?').join(', ');
  const rows = getDb()
    .prepare(
      `SELECT mg.movie_id AS movieId, g.id, g.name, g.slug
         FROM movie_genres mg
         JOIN genres g ON g.id = mg.genre_id
        WHERE mg.movie_id IN (${placeholders})
        ORDER BY g.name ASC`,
    )
    .all(...ids) as Array<{ movieId: number } & Genre>;

  for (const row of rows) {
    const list = grouped.get(row.movieId) ?? [];
    list.push({ id: row.id, name: row.name, slug: row.slug });
    grouped.set(row.movieId, list);
  }

  return grouped;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function buildWhere(filters: CatalogFilters): { sql: string; params: unknown[] } {
  const clauses: string[] = [];
  const params: unknown[] = [];

  const search = filters.search?.trim();
  if (search) {
    const pattern = `%${escapeLike(search.toLowerCase())}%`;
    clauses.push(
      `(LOWER(m.title) LIKE ? ESCAPE '\\'
        OR LOWER(COALESCE(m.original_title, '')) LIKE ? ESCAPE '\\'
        OR LOWER(m.tagline) LIKE ? ESCAPE '\\'
        OR LOWER(m.synopsis) LIKE ? ESCAPE '\\')`,
    );
    params.push(pattern, pattern, pattern, pattern);
  }

  if (filters.genres.length > 0) {
    const placeholders = filters.genres.map(() => '?').join(', ');
    clauses.push(
      `m.id IN (
         SELECT mg.movie_id
           FROM movie_genres mg
           JOIN genres g ON g.id = mg.genre_id
          WHERE g.slug IN (${placeholders})
       )`,
    );
    params.push(...filters.genres);
  }

  if (typeof filters.year === 'number') {
    clauses.push('m.release_year = ?');
    params.push(filters.year);
  }

  if (typeof filters.minScore === 'number') {
    clauses.push('m.score >= ?');
    params.push(filters.minScore);
  }

  if (typeof filters.featured === 'boolean') {
    clauses.push('m.featured = ?');
    params.push(filters.featured ? 1 : 0);
  }

  return {
    sql: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
}

function decorate(rows: MovieRow[]): Movie[] {
  const genres = genresForMovies(rows.map((row) => row.id));
  return rows.map((row) => toMovie(row, genres.get(row.id) ?? []));
}

export function listMovies(filters: CatalogFilters): Page<Movie> {
  const db = getDb();
  const where = buildWhere(filters);

  const { total } = db
    .prepare(`SELECT COUNT(*) AS total FROM movies m ${where.sql}`)
    .get(...where.params) as { total: number };

  const offset = (filters.page - 1) * filters.limit;
  const direction = filters.order === 'asc' ? 'ASC' : 'DESC';
  const sortColumn = SORT_COLUMNS[filters.sort];

  const rows = db
    .prepare(
      `SELECT ${COLUMNS}
         FROM movies m
         ${where.sql}
        ORDER BY ${sortColumn} ${direction}, m.title COLLATE NOCASE ASC
        LIMIT ? OFFSET ?`,
    )
    .all(...where.params, filters.limit, offset) as MovieRow[];

  const totalPages = filters.limit > 0 ? Math.ceil(total / filters.limit) : 0;

  return {
    items: decorate(rows),
    page: filters.page,
    limit: filters.limit,
    total,
    totalPages,
    hasMore: offset + rows.length < total,
  };
}

export function findMovieByIdOrSlug(idOrSlug: string | number): Movie | null {
  const db = getDb();
  const byId = /^\d+$/.test(String(idOrSlug));
  const row = db
    .prepare(
      `SELECT ${COLUMNS} FROM movies m WHERE ${byId ? 'm.id = ?' : 'm.slug = ?'} LIMIT 1`,
    )
    .get(byId ? Number(idOrSlug) : String(idOrSlug)) as MovieRow | undefined;

  return row ? toMovie(row, genresForMovies([row.id]).get(row.id) ?? []) : null;
}

/** Peliculas del mismo genero principal, excluida la propia. */
export function listSimilar(movie: Movie, limit = 8): Movie[] {
  if (movie.genres.length === 0) return [];

  const db = getDb();
  const primaryGenre = movie.genres[0]?.slug ?? '';
  const rows = db
    .prepare(
      `SELECT ${COLUMNS}
         FROM movies m
        WHERE m.id <> ?
          AND m.id IN (
            SELECT mg.movie_id
              FROM movie_genres mg
              JOIN genres g ON g.id = mg.genre_id
             WHERE g.slug = ?
          )
        ORDER BY m.score DESC, m.popularity DESC
        LIMIT ?`,
    )
    .all(movie.id, primaryGenre, limit) as MovieRow[];

  return decorate(rows);
}

export function listByIds(ids: number[]): Movie[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(', ');
  const rows = getDb()
    .prepare(`SELECT ${COLUMNS} FROM movies m WHERE m.id IN (${placeholders})`)
    .all(...ids) as MovieRow[];
  return decorate(rows);
}

/** Anos disponibles para el filtro de year, con numero de peliculas. */
export function listYears(): Array<{ year: number; movieCount: number }> {
  return getDb()
    .prepare(
      `SELECT release_year AS year, COUNT(*) AS movieCount
         FROM movies
        WHERE release_year IS NOT NULL
        GROUP BY release_year
        ORDER BY release_year DESC`,
    )
    .all() as Array<{ year: number; movieCount: number }>;
}

export interface MovieInput {
  slug?: string;
  title: string;
  originalTitle?: string | null;
  tagline?: string | null;
  synopsis: string;
  releaseDate?: string | null;
  releaseYear?: number | null;
  runtimeMinutes?: number | null;
  ageRating?: string | null;
  score: number;
  popularity: number;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  videoSource: MovieSource;
  videoUrl: string;
  trailerUrl?: string | null;
  featured: boolean;
  /** Slugs de genero; los desconocidos se crean al vuelo. */
  genres: string[];
}

function assertSlugAvailable(slug: string, ignoreId?: number): void {
  const rows = getDb()
    .prepare(`SELECT id FROM movies WHERE slug = ?${ignoreId ? ' AND id <> ?' : ''}`)
    .all(...(ignoreId ? [slug, ignoreId] : [slug])) as Array<{ id: number }>;

  if (rows.length > 0) {
    throw new ApiError(409, 'slug_taken', `Ya existe una pelicula con el slug "${slug}"`);
  }
}

function replaceMovieGenres(movieId: number, genreSlugs: string[]): void {
  const db = getDb();
  db.prepare('DELETE FROM movie_genres WHERE movie_id = ?').run(movieId);

  const insert = db.prepare('INSERT OR IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?, ?)');
  for (const slug of new Set(genreSlugs.map((entry) => entry.trim()).filter(Boolean))) {
    const genre = ensureGenreBySlug(slug);
    insert.run(movieId, genre.id);
  }
}

function yearFromDate(releaseDate: string | null | undefined): number | null {
  if (!releaseDate) return null;
  const year = Number.parseInt(releaseDate.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

export function createMovie(input: MovieInput): Movie {
  const slug = input.slug ?? input.title;
  assertSlugAvailable(slug);

  const releaseYear = input.releaseYear ?? yearFromDate(input.releaseDate);

  const info = getDb()
    .prepare(
      `INSERT INTO movies (
         slug, title, original_title, tagline, synopsis, release_year, release_date,
         runtime_minutes, age_rating, score, popularity, poster_url, backdrop_url,
         video_source, video_url, trailer_url, featured
       ) VALUES (
         @slug, @title, @originalTitle, @tagline, @synopsis, @releaseYear, @releaseDate,
         @runtimeMinutes, @ageRating, @score, @popularity, @posterUrl, @backdropUrl,
         @videoSource, @videoUrl, @trailerUrl, @featured
       )`,
    )
    .run({
      slug,
      title: input.title,
      originalTitle: input.originalTitle ?? null,
      tagline: input.tagline ?? null,
      synopsis: input.synopsis,
      releaseYear,
      releaseDate: input.releaseDate ?? null,
      runtimeMinutes: input.runtimeMinutes ?? null,
      ageRating: input.ageRating ?? null,
      score: input.score,
      popularity: input.popularity,
      posterUrl: input.posterUrl ?? null,
      backdropUrl: input.backdropUrl ?? null,
      videoSource: input.videoSource,
      videoUrl: input.videoUrl,
      trailerUrl: input.trailerUrl ?? null,
      featured: input.featured ? 1 : 0,
    });

  const id = Number(info.lastInsertRowid);
  replaceMovieGenres(id, input.genres);

  const created = findMovieByIdOrSlug(id);
  if (!created) throw new Error('No se pudo crear la pelicula');
  return created;
}

export function updateMovie(id: number, input: MovieInput): Movie | null {
  const existing = findMovieByIdOrSlug(id);
  if (!existing) return null;

  const slug = input.slug ?? existing.slug;
  assertSlugAvailable(slug, id);

  const releaseYear = input.releaseYear ?? yearFromDate(input.releaseDate);

  getDb()
    .prepare(
      `UPDATE movies SET
         slug = @slug, title = @title, original_title = @originalTitle, tagline = @tagline,
         synopsis = @synopsis, release_year = @releaseYear, release_date = @releaseDate,
         runtime_minutes = @runtimeMinutes, age_rating = @ageRating, score = @score,
         popularity = @popularity, poster_url = @posterUrl, backdrop_url = @backdropUrl,
         video_source = @videoSource, video_url = @videoUrl, trailer_url = @trailerUrl,
         featured = @featured, updated_at = datetime('now')
       WHERE id = @id`,
    )
    .run({
      id,
      slug,
      title: input.title,
      originalTitle: input.originalTitle ?? null,
      tagline: input.tagline ?? null,
      synopsis: input.synopsis,
      releaseYear,
      releaseDate: input.releaseDate ?? null,
      runtimeMinutes: input.runtimeMinutes ?? null,
      ageRating: input.ageRating ?? null,
      score: input.score,
      popularity: input.popularity,
      posterUrl: input.posterUrl ?? null,
      backdropUrl: input.backdropUrl ?? null,
      videoSource: input.videoSource,
      videoUrl: input.videoUrl,
      trailerUrl: input.trailerUrl ?? null,
      featured: input.featured ? 1 : 0,
    });

  replaceMovieGenres(id, input.genres);
  return findMovieByIdOrSlug(id);
}

export function deleteMovie(id: number): boolean {
  return getDb().prepare('DELETE FROM movies WHERE id = ?').run(id).changes > 0;
}

export interface CatalogStats {
  movies: {
    total: number;
    featured: number;
    averageScore: number;
    totalRuntimeMinutes: number;
  };
  genres: { total: number; top: Array<{ name: string; slug: string; total: number }> };
  years: { earliest: number | null; latest: number | null };
  latest: Movie[];
  topRated: Movie[];
}

export function catalogStats(): CatalogStats {
  const db = getDb();

  const movies = db
    .prepare(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(featured), 0) AS featured,
              COALESCE(ROUND(AVG(score), 2), 0) AS averageScore,
              COALESCE(SUM(runtime_minutes), 0) AS totalRuntimeMinutes,
              MIN(release_year) AS earliest,
              MAX(release_year) AS latest
         FROM movies`,
    )
    .get() as {
    total: number;
    featured: number;
    averageScore: number;
    totalRuntimeMinutes: number;
    earliest: number | null;
    latest: number | null;
  };

  const { total: genreTotal } = db
    .prepare('SELECT COUNT(*) AS total FROM genres')
    .get() as { total: number };

  const topGenres = db
    .prepare(
      `SELECT g.name, g.slug, COUNT(mg.movie_id) AS total
         FROM genres g
         LEFT JOIN movie_genres mg ON mg.genre_id = g.id
        GROUP BY g.id
        ORDER BY total DESC, g.name ASC
        LIMIT 6`,
    )
    .all() as Array<{ name: string; slug: string; total: number }>;

  const latest = decorate(
    db
      .prepare(`SELECT ${COLUMNS} FROM movies m ORDER BY m.release_date DESC, m.id DESC LIMIT 5`)
      .all() as MovieRow[],
  );

  const topRated = decorate(
    db
      .prepare(`SELECT ${COLUMNS} FROM movies m ORDER BY m.score DESC, m.popularity DESC LIMIT 5`)
      .all() as MovieRow[],
  );

  return {
    movies: {
      total: movies.total,
      featured: movies.featured,
      averageScore: movies.averageScore,
      totalRuntimeMinutes: movies.totalRuntimeMinutes,
    },
    genres: { total: genreTotal, top: topGenres },
    years: { earliest: movies.earliest, latest: movies.latest },
    latest,
    topRated,
  };
}