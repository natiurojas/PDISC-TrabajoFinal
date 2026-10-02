import { Router } from 'express';
import { listGenres } from '../db/genresRepo.js';
import { listYears } from '../db/moviesRepo.js';

export const genresRouter = Router();

genresRouter.get('/', (_req, res) => {
  res.json({ items: listGenres() });
});

/** Filtros derivados de los datos disponibles: generos y anios con peliculas. */
export const facetsRouter = Router();

facetsRouter.get('/', (_req, res) => {
  res.json({
    genres: listGenres(),
    years: listYears(),
  });
});