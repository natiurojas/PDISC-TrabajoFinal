import { Router } from 'express';
import { findMovieByIdOrSlug, listMovies, listSimilar, type CatalogFilters } from '../db/moviesRepo.js';
import type { CatalogSort, SortOrder } from '../db/types.js';
import { verifyPlaybackToken } from '../auth/playback.js';
import { ApiError } from '../lib/errors.js';
import {
  parseBoolean,
  parseEnum,
  parseIntOr,
  parseList,
  parseNumberOrUndefined,
  requireParam,
} from '../lib/query.js';
import { asyncHandler } from '../middleware/index.js';
import { openStream } from '../services/stream.js';

const SORTS = ['popularity', 'score', 'year', 'title', 'runtime'] as const satisfies readonly CatalogSort[];
const ORDERS = ['asc', 'desc'] as const satisfies readonly SortOrder[];

export const moviesRouter = Router();

moviesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const filters: CatalogFilters = {
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      genres: parseList(req.query.genre ?? req.query.genres),
      year: parseIntOr(req.query.year, Number.NaN, { min: 1888, max: 2200 }),
      minScore: parseNumberOrUndefined(req.query.minScore),
      featured: parseBoolean(req.query.featured),
      sort: parseEnum<CatalogSort>(req.query.sort, SORTS, 'popularity'),
      order: parseEnum<SortOrder>(req.query.order, ORDERS, 'desc'),
      page: parseIntOr(req.query.page, 1, { min: 1, max: 10_000 }),
      limit: parseIntOr(req.query.limit, 24, { min: 1, max: 60 }),
    };

    // year/minScore/faltan -> undefined para no filtrar
    if (!Number.isFinite(filters.year as number)) filters.year = undefined;
    if (filters.minScore === undefined || Number.isNaN(filters.minScore)) filters.minScore = undefined;

    res.json(listMovies(filters));
  }),
);

moviesRouter.get(
  '/:idOrSlug',
  asyncHandler(async (req, res) => {
    const idOrSlug = requireParam(req.params.idOrSlug, 'idOrSlug');
    const movie = findMovieByIdOrSlug(idOrSlug);
    if (!movie) throw ApiError.notFound(`No existe la pelicula "${idOrSlug}"`);

    res.json(movie);
  }),
);

moviesRouter.get(
  '/:idOrSlug/similar',
  asyncHandler(async (req, res) => {
    const idOrSlug = requireParam(req.params.idOrSlug, 'idOrSlug');
    const movie = findMovieByIdOrSlug(idOrSlug);
    if (!movie) throw ApiError.notFound(`No existe la pelicula "${idOrSlug}"`);

    const limit = parseIntOr(req.query.limit, 8, { min: 1, max: 24 });
    res.json({ items: listSimilar(movie, limit) });
  }),
);

const streamHandler = asyncHandler(async (req, res) => {
  const idOrSlug = requireParam(req.params.idOrSlug, 'idOrSlug');
  const movie = findMovieByIdOrSlug(idOrSlug);
  if (!movie) throw ApiError.notFound(`No existe la pelicula "${idOrSlug}"`);

  // Acceso: peliculas gratuitas, personal del catalogo o token de reproduccion.
  const staff = req.user?.permissions.includes('movies:write') ?? false;
  const free = movie.buyPriceCents <= 0;
  const token = typeof req.query.t === 'string' ? req.query.t : undefined;
  const tokenValid = token ? verifyPlaybackToken(token, movie.id) !== null : false;

  if (!staff && !free && !tokenValid) {
    throw new ApiError(
      402,
      'payment_required',
      'Alquila o compra esta pelicula para poder reproducirla',
    );
  }

  const target = await openStream(movie, req.headers.range, req.method === 'HEAD');

  for (const [header, value] of Object.entries(target.headers)) {
    res.setHeader(header, value);
  }

  res.status(target.status);

  if (!target.body) {
    res.end();
    return;
  }

  target.body.on('error', (error: Error) => {
    console.error('[pelipop] stream interrumpido:', error.message);
    res.destroy(error);
  });

  // Si el cliente navega away, no dejamos el stream colgado.
  res.on('close', () => target.body?.destroy());

  target.body.pipe(res);
});

moviesRouter.get('/:idOrSlug/stream', streamHandler);
moviesRouter.head('/:idOrSlug/stream', streamHandler);