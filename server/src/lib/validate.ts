import { ApiError } from './errors.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Body = Record<string, unknown>;

export function asBody(value: unknown): Body {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw ApiError.badRequest('El cuerpo de la peticion debe ser un objeto JSON');
  }
  return value as Body;
}

export function requireString(value: unknown, field: string, min = 1, max = 500): string {
  if (typeof value !== 'string') {
    throw ApiError.badRequest(`El campo "${field}" es obligatorio`);
  }

  const trimmed = value.trim();
  if (trimmed.length < min) {
    throw ApiError.badRequest(`El campo "${field}" debe tener al menos ${min} caracteres`);
  }
  if (trimmed.length > max) {
    throw ApiError.badRequest(`El campo "${field}" no puede superar ${max} caracteres`);
  }

  return trimmed;
}

export function optionalString(
  value: unknown,
  field: string,
  min = 0,
  max = 5000,
): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') {
    throw ApiError.badRequest(`El campo "${field}" debe ser texto`);
  }

  const trimmed = value.trim();
  if (trimmed.length < min) {
    throw ApiError.badRequest(`El campo "${field}" debe tener al menos ${min} caracteres`);
  }
  if (trimmed.length > max) {
    throw ApiError.badRequest(`El campo "${field}" no puede superar ${max} caracteres`);
  }

  return trimmed;
}

export function requireEmail(value: unknown): string {
  const email = requireString(value, 'email', 5, 200).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw ApiError.badRequest('El correo electronico no tiene un formato valido');
  }
  return email;
}

/** Reglas minimas de contrasena: 8-128 caracteres con letra y numero. */
export function requirePassword(value: unknown, field = 'password'): string {
  if (typeof value !== 'string') {
    throw ApiError.badRequest(`El campo "${field}" es obligatorio`);
  }
  if (value.length < 8) {
    throw ApiError.badRequest('La contrasena debe tener al menos 8 caracteres');
  }
  if (value.length > 128) {
    throw ApiError.badRequest('La contrasena no puede superar 128 caracteres');
  }
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    throw ApiError.badRequest('La contrasena debe incluir al menos una letra y un numero');
  }
  return value;
}

export function requireNumber(
  value: unknown,
  field: string,
  { min = -Infinity, max = Infinity }: { min?: number; max?: number } = {},
): number {
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) {
    throw ApiError.badRequest(`El campo "${field}" debe ser un numero`);
  }
  if (parsed < min || parsed > max) {
    throw ApiError.badRequest(`El campo "${field}" debe estar entre ${min} y ${max}`);
  }
  return parsed;
}

export function optionalNumber(
  value: unknown,
  field: string,
  opts: { min?: number; max?: number } = {},
): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return requireNumber(value, field, opts);
}

export function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1) return true;
  if (value === 'false' || value === 0) return false;
  throw ApiError.badRequest(`El campo "${field}" debe ser booleano`);
}

export function optionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return requireBoolean(value, field);
}

export function requiredStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw ApiError.badRequest(`El campo "${field}" debe ser una lista`);
  }

  return value.map((entry) => requireString(entry, field, 1, 80));
}

export function optionalStringArray(value: unknown, field: string): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  return requiredStringArray(value, field);
}

/** Convierte "Ciudad de Cristal" en "ciudad-de-cristal". */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function requireIsoDate(value: unknown, field: string): string {
  const date = requireString(value, field, 4, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw ApiError.badRequest(`El campo "${field}" debe tener formato AAAA-MM-DD`);
  }
  return date;
}

export function optionalIsoDate(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return requireIsoDate(value, field);
}