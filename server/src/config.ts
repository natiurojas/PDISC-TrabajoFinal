import path from 'node:path';
import process from 'node:process';

function int(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const rootDir = path.resolve(import.meta.dirname, '..', '..');

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  get isProduction() {
    return this.env === 'production';
  },
  host: process.env.HOST ?? '0.0.0.0',
  port: int(process.env.PORT, 4000),
  rootDir,
  /** Fichero SQLite. Por defecto queda fuera de dist/ para que sobreviva a los builds. */
  databaseFile: process.env.DATABASE_FILE ?? path.join(rootDir, 'data', 'pelipop.db'),
  /** Carpeta con archivos .mp4 locales servidos como source = 'local'. */
  videosDir: process.env.VIDEOS_DIR ?? path.join(rootDir, 'data', 'videos'),
  /** Origenes permitidos para el navegador en desarrollo. '*' permite cualquiera. */
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  requestTimeoutMs: int(process.env.REQUEST_TIMEOUT_MS, 20_000),
  /**
   * Secreto para firmar JWT. En produccion es obligatorio definirlo via
   * JWT_SECRET; en desarrollo usamos uno local y efimero.
   */
  jwtSecret: process.env.JWT_SECRET ?? 'pelipop_dev_secret_no_usar_en_produccion',
  jwtExpiresInSeconds: int(process.env.JWT_EXPIRES_IN_SECONDS, 60 * 60 * 24),
  isDevSecret: !process.env.JWT_SECRET,
} as const;