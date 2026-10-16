import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import type { Role } from './permissions.js';

export interface TokenPayload {
  /** Id del usuario. */
  sub: number;
  email: string;
  role: Role;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign({ email: payload.email, role: payload.role }, config.jwtSecret, {
    subject: String(payload.sub),
    algorithm: 'HS256',
    expiresIn: config.jwtExpiresInSeconds,
    issuer: 'pelipop',
  });
}

/** Lanza si la firma, la fecha o el emisor no son validos. */
export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, config.jwtSecret, {
    algorithms: ['HS256'],
    issuer: 'pelipop',
  }) as jwt.JwtPayload;

  const sub = Number(decoded.sub);
  const role = decoded.role as Role;
  const email = decoded.email;

  if (!Number.isInteger(sub) || typeof email !== 'string' || typeof role !== 'string') {
    throw new Error('Payload de token incompleto');
  }

  return { sub, email, role };
}