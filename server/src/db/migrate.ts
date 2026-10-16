import { config } from '../config.js';
import { closeDb, getDb } from './index.js';
import { SCHEMA_SQL } from './schema.js';

const db = getDb();
db.exec(SCHEMA_SQL);

const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
  .all() as Array<{ name: string }>;

console.log(`[pelipop] Esquema aplicado en ${config.databaseFile}`);
console.log(`[pelipop] Tablas: ${tables.map((table) => table.name).join(', ')}`);

closeDb();
