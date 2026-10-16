import { Router } from 'express';
import { config } from '../config.js';
import { signToken } from '../auth/token.js';
import {
  createUser,
  emailExists,
  findUserByEmail,
  updatePassword,
  verifyPassword,
  type User,
} from '../db/usersRepo.js';
import { ApiError } from '../lib/errors.js';
import { asBody, requireEmail, requirePassword, requireString } from '../lib/validate.js';
import { currentUser, requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/index.js';

export const authRouter = Router();

function session(user: User) {
  return {
    token: signToken({ sub: user.id, email: user.email, role: user.role }),
    tokenType: 'Bearer' as const,
    expiresInSeconds: config.jwtExpiresInSeconds,
    user,
  };
}

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const body = asBody(req.body);
    const email = requireEmail(body.email);
    const password = requirePassword(body.password);
    const displayName = requireString(body.displayName ?? body.name, 'displayName', 2, 80);

    if (emailExists(email)) {
      throw new ApiError(409, 'email_taken', 'Ya existe una cuenta registrada con ese correo');
    }

    // El registro publico nunca permite elegir rol: siempre 'user'.
    const user = await createUser({ email, password, displayName, role: 'user' });
    res.status(201).json(session(user));
  }),
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = asBody(req.body);
    const email = requireEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';

    const user = findUserByEmail(email);

    // Mismo error para usuario inexistente y contrasena incorrecta:
    // asi no se puede enumerar cuentas desde fuera.
    const invalid = new ApiError(401, 'invalid_credentials', 'Correo o contrasena incorrectos');
    if (!user) throw invalid;

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw invalid;

    if (!user.isActive) {
      throw new ApiError(
        403,
        'account_disabled',
        'Tu cuenta esta desactivada. Contacta con administracion.',
      );
    }

    const { passwordHash: _hash, ...publicUser } = user;
    res.json(session(publicUser));
  }),
);

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: currentUser(req) });
});

authRouter.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const body = asBody(req.body);
    const currentPassword =
      typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = requirePassword(body.newPassword, 'newPassword');

    const stored = findUserByEmail(user.email);
    if (!stored || !(await verifyPassword(currentPassword, stored.passwordHash))) {
      throw new ApiError(401, 'invalid_credentials', 'La contrasena actual no es correcta');
    }

    if (await verifyPassword(newPassword, stored.passwordHash)) {
      throw ApiError.badRequest('La nueva contrasena debe ser distinta a la actual');
    }

    await updatePassword(user.id, newPassword);
    res.json({ ok: true, message: 'Contrasena actualizada correctamente' });
  }),
);