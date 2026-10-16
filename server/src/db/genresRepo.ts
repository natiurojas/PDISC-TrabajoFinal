import { getDb } from './index.js';
import type { Genre, GenreWithCount } from './types.js';
import { ApiError } from '../lib/errors.js';

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

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function createGenre(name: string): Genre {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    throw ApiError.badRequest('El nombre del genero es demasiado corto');
  }

  const slug = slugify(trimmed);
  if (!slug) throw ApiError.badRequest('El nombre del genero no es valido');
  if (findGenreBySlug(slug)) {
    throw new ApiError(409, 'genre_exists', `El genero "${trimmed}" ya existe`);
  }

  const info = getDb()
    .prepare('INSERT INTO genres (name, slug) VALUES (?, ?)')
    .run(trimmed, slug);

  return { id: Number(info.lastInsertRowid), name: trimmed, slug };
}

/**
 * Devuelve el genero existente o lo crea a partir del slug recibido.
 * Permite que el formulario de peliculas acepte generos nuevos sin un paso extra.
 */
export function ensureGenreBySlug(slug: string): Genre {
  const normalized = slugify(slug);
  const existing = findGenreBySlug(normalized);
  if (existing) return existing;

  const name = normalized
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const info = getDb()
    .prepare('INSERT INTO genres (name, slug) VALUES (?, ?)')
    .run(name, normalized);

  return { id: Number(info.lastInsertRowid), name, slug: normalized };
}

export function deleteGenre(id: number): boolean {
  return getDb().prepare('DELETE FROM genres WHERE id = ?').run(id).changes > 0;
}

/** Usado por el seed: respeta el nombre tal cual viene en el catalogo fuente. */
export function findOrCreateGenre(name: string, slug: string): Genre {
  const existing = findGenreBySlug(slug);
  if (existing) return existing;

  const info = getDb().prepare('INSERT INTO genres (name, slug) VALUES (?, ?)').run(name, slug);
  return { id: Number(info.lastInsertRowid), name, slug };
}