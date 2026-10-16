import process from 'node:process';
import { createApp } from './app.js';
import { config } from './config.js';
import { closeDb, getDb, isEmptyCatalog } from './db/index.js';

if (config.isProduction && config.isDevSecret) {
  console.error(
    '[pelipop] JWT_SECRET no esta definido. En produccion es obligatorio: abortando el arranque.',
  );
  process.exit(1);
}

getDb();

if (isEmptyCatalog()) {
  console.warn('[pelipop] El catalogo esta vacio. Ejecuta "npm run db:seed" para cargar los datos.');
}

const server = createApp().listen(config.port, config.host, () => {
  console.log(`[pelipop] API lista en http://localhost:${config.port}`);
  console.log(`[pelipop] Entorno: ${config.env}`);
});

function shutdown(signal: string): void {
  console.log(`\n[pelipop] ${signal} recibido. Cerrando servidor...`);
  server.close(() => {
    closeDb();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
