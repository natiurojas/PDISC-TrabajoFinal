import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { verifyToken } from '../auth/token.js';
import { hasPermission, type Permission } from '../auth/permissions.js';
import { findUserById, type User } from '../db/usersRepo.js';
import { ApiError } from '../lib/errors.js';

/** Rellena `req.user` si la cabecera Authorization trae un Bearer valido. */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const payload = verifyToken(header.slice(7).trim());
    // Se relee el usuario: el rol/estado puede haber cambiado tras emitir el token.
    const user = findUserById(payload.sub);
    if (user?.isActive) req.user = user;
  } catch {
    // Token invalido o caducado: la request sigue sin usuario y las
    // protecciones de abajo responderan 401.
  }

  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new ApiError(401, 'unauthenticated', 'Debes iniciar sesion para acceder a este recurso'));
    return;
  }
  next();
}

export function requirePermission(permission: Permission): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(
        new ApiError(401, 'unauthenticated', 'Debes iniciar sesion para acceder a este recurso'),
      );
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      next(
        new ApiError(403, 'forbidden', `Tu rol no tiene el permiso "${permission}"`),
      );
      return;
    }

    next();
  };
}

/** Helper para handlers que ya pasaron por `requireAuth`. */
export function currentUser(req: Request): User {
  const user = req.user;
  if (!user) throw new ApiError(401, 'unauthenticated', 'Debes iniciar sesion');
  return user;
}