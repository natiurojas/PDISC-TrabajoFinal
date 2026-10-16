import type { Role } from '../types';

/** Orden de presentacion: de mas a menos permisos. */
export const ROLES: Role[] = ['admin', 'editor', 'user'];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  user: 'Usuario',
};
