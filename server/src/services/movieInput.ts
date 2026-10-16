import type { MovieInput } from '../db/moviesRepo.js';
import type { MovieSource } from '../db/types.js';
import { ApiError } from '../lib/errors.js';
import {
  asBody,
  optionalBoolean,
  optionalIsoDate,
  optionalNumber,
  optionalString,
  optionalStringArray,
  requireNumber,
  requireString,
  slugify,
} from '../lib/validate.js';

const VIDEO_SOURCES: readonly MovieSource[] = ['remote', 'local'];
const AGE_RATINGS = ['TP', '7', '12', '16', '18'];

function optionalUrl(value: unknown, field: string): string | undefined {
  const raw = optionalString(value, field, 1, 1000);
  if (!raw) return undefined;

  if (/^https?:\/\//i.test(raw) || raw.startsWith('/')) return raw;
  throw ApiError.badRequest(`El campo "${field}" debe ser una URL http(s) o una ruta que empiece por "/"`);
}

/** Normaliza y valida el cuerpo de alta/edicion de una pelicula. */
export function parseMovieInput(payload: unknown): MovieInput {
  const body = asBody(payload);

  const title = requireString(body.title, 'title', 1, 200);
  const videoSourceRaw = optionalString(body.videoSource, 'videoSource', 1, 10) ?? 'remote';
  const videoSource = VIDEO_SOURCES.find((source) => source === videoSourceRaw);
  if (!videoSource) {
    throw ApiError.badRequest('El campo "videoSource" debe ser "remote" o "local"');
  }

  const videoUrl = requireString(body.videoUrl, 'videoUrl', 1, 1000);
  if (videoSource === 'remote' && !/^https?:\/\//i.test(videoUrl)) {
    throw ApiError.badRequest('Con videoSource "remote", "videoUrl" debe ser una URL http(s)');
  }
  if (videoSource === 'local' && /^https?:\/\//i.test(videoUrl)) {
    throw ApiError.badRequest(
      'Con videoSource "local", "videoUrl" debe ser una ruta relativa dentro de VIDEOS_DIR',
    );
  }

  const ageRatingRaw = optionalString(body.ageRating, 'ageRating', 1, 4)?.toUpperCase();
  if (ageRatingRaw && !AGE_RATINGS.includes(ageRatingRaw)) {
    throw ApiError.badRequest(`La clasificacion por edad debe ser una de: ${AGE_RATINGS.join(', ')}`);
  }

  const providedSlug = optionalString(body.slug, 'slug', 1, 80);
  const slug = providedSlug ? slugify(providedSlug) : slugify(title);
  if (!slug) throw ApiError.badRequest('No se pudo generar un slug valido a partir del titulo');

  return {
    slug,
    title,
    originalTitle: optionalString(body.originalTitle, 'originalTitle', 1, 200) ?? null,
    tagline: optionalString(body.tagline, 'tagline', 1, 300) ?? null,
    synopsis: optionalString(body.synopsis, 'synopsis', 0, 5000) ?? '',
    releaseDate: optionalIsoDate(body.releaseDate, 'releaseDate') ?? null,
    releaseYear: optionalNumber(body.releaseYear, 'releaseYear', { min: 1888, max: 2200 }) ?? null,
    runtimeMinutes:
      optionalNumber(body.runtimeMinutes, 'runtimeMinutes', { min: 1, max: 900 }) ?? null,
    ageRating: ageRatingRaw ?? null,
    score: requireNumber(body.score ?? 0, 'score', { min: 0, max: 10 }),
    popularity: optionalNumber(body.popularity, 'popularity', { min: 0, max: 1000 }) ?? 0,
    posterUrl: optionalUrl(body.posterUrl, 'posterUrl') ?? null,
    backdropUrl: optionalUrl(body.backdropUrl, 'backdropUrl') ?? null,
    videoSource,
    videoUrl,
    trailerUrl: optionalUrl(body.trailerUrl, 'trailerUrl') ?? null,
    featured: optionalBoolean(body.featured, 'featured') ?? false,
    genres: optionalStringArray(body.genres, 'genres')?.map((entry) => slugify(entry)) ?? [],
  };
}