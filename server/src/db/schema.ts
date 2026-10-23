/**
 * DDL de Pelipop. Se mantiene en TS (y no en .sql) para que el build
 * no dependa de copiar assets junto al compilado.
 */
export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT    NOT NULL,
  display_name  TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'editor', 'user')),
  is_active     INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

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
  rent_price_cents INTEGER NOT NULL DEFAULT 399,
  buy_price_cents  INTEGER NOT NULL DEFAULT 999,
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

/* ------------------------------------------------------------------ */
/* Pagos simulados                                                     */
/* ------------------------------------------------------------------ */

CREATE TABLE IF NOT EXISTS purchases (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  reference      TEXT    NOT NULL UNIQUE,
  user_id        INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  movie_id       INTEGER NOT NULL REFERENCES movies (id) ON DELETE CASCADE,
  kind           TEXT    NOT NULL CHECK (kind IN ('rent', 'buy')),
  status         TEXT    NOT NULL CHECK (status IN ('paid', 'failed')),
  amount_cents   INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency       TEXT    NOT NULL DEFAULT 'EUR',
  method         TEXT    NOT NULL DEFAULT 'card',
  card_last4     TEXT,
  failure_reason TEXT,
  expires_at     TEXT,
  paid_at        TEXT,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_purchases_user     ON purchases (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_movie    ON purchases (movie_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status   ON purchases (status);
`;

/** Vaciamos todas las tablas hijas antes que las padre (respetando FK). */
export const TRUNCATE_SQL = `
DELETE FROM purchases;
DELETE FROM movie_genres;
DELETE FROM movies;
DELETE FROM genres;
DELETE FROM sqlite_sequence WHERE name IN ('purchases', 'movies', 'genres');
`;