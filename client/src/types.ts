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
  payments: PaymentStats;
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
  rentPriceCents?: number;
  buyPriceCents?: number;
  featured: boolean;
  genres: string[];
}

/* ------------------------------------------------------------------ */
/* Pagos simulados                                                     */
/* ------------------------------------------------------------------ */

export type PurchaseKind = 'rent' | 'buy';
export type PurchaseStatus = 'paid' | 'failed';
export type PaymentMethod = 'card' | 'paypal';
export type EntitlementSource = 'purchase' | 'staff' | 'free';

export interface PurchaseMovie {
  id: number;
  slug: string;
  title: string;
  posterUrl: string | null;
}

export interface Purchase {
  id: number;
  reference: string;
  kind: PurchaseKind;
  status: PurchaseStatus;
  amountCents: number;
  currency: string;
  method: PaymentMethod;
  cardLast4: string | null;
  failureReason: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  createdAt: string;
  movie: PurchaseMovie;
}

export interface PaymentStats {
  revenueCents: number;
  paidCount: number;
  rentCount: number;
  buyCount: number;
  failedCount: number;
  recent: Purchase[];
}

export interface MovieAccess {
  movie: { id: number; slug: string; title: string };
  free: boolean;
  prices: { rentCents: number; buyCents: number; currency: string };
  entitlement: {
    owned: boolean;
    kind: PurchaseKind | null;
    expiresAt: string | null;
    source: EntitlementSource | null;
  };
  streamUrl: string | null;
  playbackTtlSeconds: number;
  rentDurationHours: number;
}

export interface CheckoutPayload {
  idOrSlug: string;
  kind: PurchaseKind;
  method: PaymentMethod;
  cardNumber?: string;
  cardName?: string;
  cardExpiry?: string;
  cardCvv?: string;
  paypalEmail?: string;
}

export interface CheckoutResult {
  ok: boolean;
  purchase: Purchase;
  streamUrl: string | null;
  message: string;
}

export interface TestCard {
  number: string;
  brand: string;
  outcome: 'paid' | 'failed';
  label: string;
}
