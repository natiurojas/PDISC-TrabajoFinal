import jwt from 'jsonwebtoken';
import { config } from '../config.js';

const ISSUER = 'pelipop';
const SCOPE = 'playback';

/**
 * Los elementos <video> no pueden enviar cabeceras Authorization, asi que
 * emitimos un token de corta duracion que viaja en la query del stream.
 */
export const PLAYBACK_TTL_SECONDS = 60 * 60 * 6;

export function signPlaybackToken(userId: number, movieId: number): string {
  return jwt.sign({ scope: SCOPE, movie: movieId }, config.jwtSecret, {
    subject: String(userId),
    algorithm: 'HS256',
    expiresIn: PLAYBACK_TTL_SECONDS,
    issuer: ISSUER,
  });
}

/** Devuelve el id de usuario si el token es valido para esa pelicula. */
export function verifyPlaybackToken(token: string, movieId: number): number | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
      issuer: ISSUER,
    }) as jwt.JwtPayload;

    if (decoded.scope !== SCOPE) return null;
    if (Number(decoded.movie) !== movieId) return null;

    const sub = Number(decoded.sub);
    return Number.isInteger(sub) ? sub : null;
  } catch {
    return null;
  }
}
