export type MovieSource = 'remote' | 'local';

export type CatalogSort = 'popularity' | 'score' | 'year' | 'title' | 'runtime';
export type SortOrder = 'asc' | 'desc';

export interface Genre {
  id: number;
  name: string;
  slug: string;
}

export interface GenreWithCount extends Genre {
  movieCount: number;
}

export interface Movie {
  id: number;
  slug: string;
  title: string;
  originalTitle: string | null;
  tagline: string | null;
  synopsis: string;
  releaseYear: number | null;
  releaseDate: string | null;
  runtimeMinutes: number | null;
  ageRating: string | null;
  score: number;
  popularity: number;
  posterUrl: string | null;
  backdropUrl: string | null;
  videoSource: MovieSource;
  videoUrl: string;
  /** URL del backend lista para <video src>. Nunca se expone la ruta local del disco. */
  streamUrl: string;
  trailerUrl: string | null;
  /** Precios en centimos para el modulo de pago simulado. */
  rentPriceCents: number;
  buyPriceCents: number;
  featured: boolean;
  genres: Genre[];
}

export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}