import { getDb } from './index.js';
import type { Genre, GenreWithCount } from './types.js';

interface GenreRow {
  id: number;
  name: string;
  slug: string;
  movie_count?: number;
}

export function listGenres(): GenreWithCount[] {
  const rows = getDb()
    .prepare(
      `SELECT g.id, g.name, g.slug, COUNT(mg.movie_id) AS movie_count
         FROM genres g
         LEFT JOIN movie_genres mg ON mg.genre_id = g.id
        GROUP BY g.id
        ORDER BY movie_count DESC, g.name ASC`,
    )
    .all() as GenreRow[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    movieCount: row.movie_count ?? 0,
  }));
}

export function findGenreBySlug(slug: string): Genre | null {
  const row = getDb().prepare('SELECT id, name, slug FROM genres WHERE slug = ?').get(slug) as
    | GenreRow
    | undefined;

  return row ? { id: row.id, name: row.name, slug: row.slug } : null;
}