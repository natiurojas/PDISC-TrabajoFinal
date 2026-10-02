import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { config } from '../config.js';
import { SCHEMA_SQL } from './schema.js';

export type Db = Database.Database;

let db: Db | null = null;

export function getDb(): Db {
  if (db) return db;

  fs.mkdirSync(path.dirname(config.databaseFile), { recursive: true });

  db = new Database(config.databaseFile);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA_SQL);

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