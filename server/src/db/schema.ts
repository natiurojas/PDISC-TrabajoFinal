/**
 * DDL de Pelipop. Se mantiene en TS (y no en .sql) para que el build
 * no dependa de copiar assets junto al compilado.
 */
export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS genres (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT    NOT NULL UNIQUE,
  slug TEXT    NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS movies (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  slug            TEXT    NOT NULL UNIQUE,
  title           TEXT    NOT NULL,
  original_title  TEXT,
  tagline         TEXT,
  synopsis        TEXT    NOT NULL DEFAULT '',
  release_year    INTEGER,
  release_date    TEXT,
  runtime_minutes INTEGER,
  age_rating      TEXT,
  score           REAL    NOT NULL DEFAULT 0,
  popularity      REAL    NOT NULL DEFAULT 0,
  poster_url      TEXT,
  backdrop_url    TEXT,
  video_source    TEXT    NOT NULL DEFAULT 'remote' CHECK (video_source IN ('remote', 'local')),
  video_url       TEXT    NOT NULL,
  trailer_url     TEXT,
  featured        INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_movies_release_year ON movies (release_year);
CREATE INDEX IF NOT EXISTS idx_movies_score        ON movies (score DESC);
CREATE INDEX IF NOT EXISTS idx_movies_popularity   ON movies (popularity DESC);
CREATE INDEX IF NOT EXISTS idx_movies_featured     ON movies (featured);

CREATE TABLE IF NOT EXISTS movie_genres (
  movie_id INTEGER NOT NULL REFERENCES movies (id) ON DELETE CASCADE,
  genre_id INTEGER NOT NULL REFERENCES genres (id) ON DELETE CASCADE,
  PRIMARY KEY (movie_id, genre_id)
);

CREATE INDEX IF NOT EXISTS idx_movie_genres_genre ON movie_genres (genre_id);
`;

/** Vaciamos todas las tablas hijas antes que las padre (respetando FK). */
export const TRUNCATE_SQL = `
DELETE FROM movie_genres;
DELETE FROM movies;
DELETE FROM genres;
DELETE FROM sqlite_sequence WHERE name IN ('movies', 'genres');
`;