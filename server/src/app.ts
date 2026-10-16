import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import { getDb, isEmptyCatalog } from './db/index.js';
import { authenticate } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/index.js';
import { adminRouter } from './routes/admin.js';
import { authRouter } from './routes/auth.js';
import { facetsRouter, genresRouter } from './routes/catalog.js';
import { moviesRouter } from './routes/movies.js';

const CLIENT_DIST = path.join(config.rootDir, '..', 'client', 'dist');

export function createApp(): express.Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      // El player consume imagenes y video de otros origenes.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: config.corsOrigins.includes('*') ? true : config.corsOrigins,
      methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );
  if (!config.isProduction) app.use(morgan('dev'));

  app.use(express.json({ limit: '200kb' }));

  // Solo lee el Bearer si existe; las rutas deciden si exigen sesion.
  app.use('/api', authenticate);

  app.get('/api/health', (_req, res) => {
    const { total } = getDb().prepare('SELECT COUNT(*) AS total FROM movies').get() as {
      total: number;
    };
    res.json({
      status: 'ok',
      env: config.env,
      uptime: Math.round(process.uptime()),
      movies: total,
      catalogSeeded: !isEmptyCatalog(),
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/genres', genresRouter);
  app.use('/api/facets', facetsRouter);
  app.use('/api/movies', moviesRouter);

  // En produccion el mismo proceso sirve el build del frontend.
  if (config.isProduction && fs.existsSync(CLIENT_DIST)) {
    app.use(express.static(CLIENT_DIST, { maxAge: '1h', index: false }));
    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}