import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { config } from '../config.js';
import { SCHEMA_SQL } from './schema.js';

export type Db = Database.Database;

let db: Db | null = null;

/** Añade una columna si la tabla existe pero no la tiene (migracion idempotente). */
function ensureColumn(db: Db, table: string, column: string, definition: string): void {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (columns.length === 0) return;
  if (!columns.some((entry) => entry.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export function getDb(): Db {
  if (db) return db;

  fs.mkdirSync(path.dirname(config.databaseFile), { recursive: true });

  db = new Database(config.databaseFile);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA_SQL);

  // Bases de datos creadas antes del modulo de pago.
  ensureColumn(db, 'movies', 'rent_price_cents', 'INTEGER NOT NULL DEFAULT 399');
  ensureColumn(db, 'movies', 'buy_price_cents', 'INTEGER NOT NULL DEFAULT 999');

  return db;
}

export function closeDb(): void {
  db?.close();
  db = null;
}

export function isEmptyCatalog(): boolean {
  const row = getDb().prepare('SELECT COUNT(*) AS total FROM movies').get() as { total: number };
  return row.total === 0;
}