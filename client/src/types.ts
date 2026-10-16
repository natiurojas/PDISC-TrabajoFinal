export type Role = 'admin' | 'editor' | 'user';

export type Permission =
  | 'admin:stats'
  | 'movies:read'
  | 'movies:write'
  | 'genres:write'
  | 'users:read'
  | 'users:write';

export type MovieSource = 'remote' | 'local';

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
  streamUrl: string;
  trailerUrl: string | null;
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

export interface User {
  id: number;
  email: string;
  displayName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: Permission[];
}

export interface Session {
  token: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  user: User;
}

export interface Facets {
  genres: GenreWithCount[];
  years: Array<{ year: number; movieCount: number }>;
}

export interface AdminStats {
  movies: {
    total: number;
    featured: number;
    averageScore: number;
    totalRuntimeMinutes: number;
  };
  genres: { total: number; top: Array<{ name: string; slug: string; total: number }> };
  years: { earliest: number | null; latest: number | null };
  users: { total: number; byRole: Array<{ role: Role; total: number }> };
  latest: Movie[];
  topRated: Movie[];
}

export interface CatalogQuery {
  search?: string;
  genre?: string[];
  year?: number;
  minScore?: number;
  featured?: boolean;
  sort?: 'popularity' | 'score' | 'year' | 'title' | 'runtime';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface MoviePayload {
  title: string;
  slug?: string;
  originalTitle?: string;
  tagline?: string;
  synopsis: string;
  releaseDate?: string;
  runtimeMinutes?: number;
  ageRating?: string;
  score: number;
  popularity: number;
  posterUrl?: string;
  backdropUrl?: string;
  videoSource: MovieSource;
  videoUrl: string;
  trailerUrl?: string;
  featured: boolean;
  genres: string[];
}
