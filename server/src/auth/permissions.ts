export const ROLES = ['admin', 'editor', 'user'] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  'admin:stats',
  'movies:read',
  'movies:write',
  'genres:write',
  'users:read',
  'users:write',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/**
 * Permisos por rol. `user` solo consume el catalogo, `editor` administra
 * el contenido y `admin` gestiona ademas usuarios y metricas.
 */
const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: PERMISSIONS,
  editor: ['movies:read', 'movies:write', 'genres:write'],
  user: ['movies:read'],
};

export function permissionsForRole(role: Role): Permission[] {
  return [...(ROLE_PERMISSIONS[role] ?? [])];
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}