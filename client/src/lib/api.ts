import type {
  AdminStats,
  CatalogQuery,
  Facets,
  Movie,
  MoviePayload,
  Page,
  Role,
  Session,
  User,
} from '../types';

const TOKEN_KEY = 'pelipop.token';
const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get isAuthError(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* almacenamiento no disponible (modo privado) */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignorado */
  }
}

function buildQuery(params: Record<string, unknown> | undefined): string {
  if (!params) return '';

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry !== undefined && entry !== null && entry !== '') {
          search.append(key, String(entry));
        }
      }
      continue;
    }
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Record<string, unknown>;
  signal?: AbortSignal;
  skipAuth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers({ Accept: 'application/json' });

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const token = options.skipAuth ? null : getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}${buildQuery(options.params)}`, {
      method: options.method ?? 'GET',
      headers,
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
      ...(options.signal ? { signal: options.signal } : {}),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(
      0,
      'network_error',
      'No se pudo contactar con el servidor. Comprueba que la API esta en marcha.',
    );
  }

  if (response.status === 204) return undefined as T;

  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = raw;
    }
  }

  if (!response.ok) {
    const errorBody = payload as { error?: { code?: string; message?: string; details?: unknown } } | null;
    const code = errorBody?.error?.code ?? `http_${response.status}`;
    const message =
      errorBody?.error?.message ??
      (typeof payload === 'string' && payload ? payload : 'Ha ocurrido un error inesperado');

    if (response.status === 401) clearToken();

    throw new ApiError(response.status, code, message, errorBody?.error?.details);
  }

  return payload as T;
}

export const api = {
  health: () => request<{ status: string; movies: number }>('/health', { skipAuth: true }),

  facets: (signal?: AbortSignal) => request<Facets>('/facets', { skipAuth: true, signal }),

  movies: {
    list: (query: CatalogQuery = {}, signal?: AbortSignal) =>
      request<Page<Movie>>('/movies', {
        skipAuth: true,
        signal,
        params: query as Record<string, unknown>,
      }),
    get: (idOrSlug: string | number, signal?: AbortSignal) =>
      request<Movie>(`/movies/${encodeURIComponent(String(idOrSlug))}`, { skipAuth: true, signal }),
    similar: (idOrSlug: string | number, limit = 8, signal?: AbortSignal) =>
      request<{ items: Movie[] }>(`/movies/${encodeURIComponent(String(idOrSlug))}/similar`, {
        skipAuth: true,
        signal,
        params: { limit },
      }),
  },

  auth: {
    login: (email: string, password: string) =>
      request<Session>('/auth/login', {
        method: 'POST',
        skipAuth: true,
        body: { email, password },
      }),
    register: (displayName: string, email: string, password: string) =>
      request<Session>('/auth/register', {
        method: 'POST',
        skipAuth: true,
        body: { displayName, email, password },
      }),
    me: (signal?: AbortSignal) => request<{ user: User }>('/auth/me', { signal }),
    changePassword: (currentPassword: string, newPassword: string) =>
      request<{ ok: boolean; message: string }>('/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      }),
  },

  admin: {
    stats: (signal?: AbortSignal) => request<AdminStats>('/admin/stats', { signal }),

    createMovie: (payload: MoviePayload) =>
      request<Movie>('/admin/movies', { method: 'POST', body: payload }),
    updateMovie: (idOrSlug: string | number, payload: MoviePayload) =>
      request<Movie>(`/admin/movies/${encodeURIComponent(String(idOrSlug))}`, {
        method: 'PUT',
        body: payload,
      }),
    deleteMovie: (idOrSlug: string | number) =>
      request<{ ok: boolean; message: string }>(
        `/admin/movies/${encodeURIComponent(String(idOrSlug))}`,
        { method: 'DELETE' },
      ),
    setFeatured: (idOrSlug: string | number, featured: boolean) =>
      request<Movie>(`/admin/movies/${encodeURIComponent(String(idOrSlug))}/featured`, {
        method: 'PATCH',
        body: { featured },
      }),

    createGenre: (name: string) =>
      request<{ id: number; name: string; slug: string }>('/admin/genres', {
        method: 'POST',
        body: { name },
      }),
    deleteGenre: (id: number) =>
      request<{ ok: boolean }>(`/admin/genres/${id}`, { method: 'DELETE' }),

    users: {
      list: (params: { search?: string; role?: Role; page?: number; limit?: number } = {}) =>
        request<Page<User>>('/admin/users', { params: params as Record<string, unknown> }),
      create: (payload: { email: string; password: string; displayName: string; role: Role }) =>
        request<User>('/admin/users', { method: 'POST', body: payload }),
      update: (
        id: number,
        payload: { displayName?: string; role?: Role; isActive?: boolean },
      ) => request<User>(`/admin/users/${id}`, { method: 'PATCH', body: payload }),
      remove: (id: number) => request<{ ok: boolean }>(`/admin/users/${id}`, { method: 'DELETE' }),
    },
  },
};

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ha ocurrido un error inesperado';
}
