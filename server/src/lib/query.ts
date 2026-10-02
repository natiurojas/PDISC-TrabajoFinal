import { ApiError } from './errors.js';

export function parseIntOr(
  value: unknown,
  fallback: number,
  { min = 0, max = Number.MAX_SAFE_INTEGER }: { min?: number; max?: number } = {},
): number {
  if (value === undefined || value === null || value === '') return fallback;

  const parsed = Number.parseInt(Array.isArray(value) ? String(value[0]) : String(value), 10);
  if (!Number.isFinite(parsed)) {
    throw ApiError.badRequest(`Valor numerico invalido: "${String(value)}"`);
  }

  return Math.min(Math.max(parsed, min), max);
}

export function parseNumberOrUndefined(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === '') return undefined;
  const raw = String(Array.isArray(value) ? value[0] : value).toLowerCase();
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  throw ApiError.badRequest(`Valor booleano invalido: "${raw}"`);
}

/** Acepta ?genre=a&genre=b y ?genre=a,b. Siempre devuelve una lista limpia. */
export function parseList(value: unknown): string[] {
  if (value === undefined || value === null || value === '') return [];

  const raw = Array.isArray(value) ? value : [value];
  return raw
    .flatMap((entry) => String(entry).split(','))
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function parseEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  if (value === undefined || value === '') return fallback;
  const raw = String(value) as T;
  if (!allowed.includes(raw)) {
    throw ApiError.badRequest(`Valor invalido "${raw}". Permitidos: ${allowed.join(', ')}`);
  }
  return raw;
}