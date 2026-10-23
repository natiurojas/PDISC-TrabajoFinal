import crypto from 'node:crypto';
import { config } from '../config.js';
import { getDb } from './index.js';
import type { Movie } from './types.js';

export type PurchaseKind = 'rent' | 'buy';
export type PurchaseStatus = 'paid' | 'failed';
export type PaymentMethod = 'card' | 'paypal';

export interface PurchaseMovie {
  id: number;
  slug: string;
  title: string;
  posterUrl: string | null;
}

export interface Purchase {
  id: number;
  reference: string;
  kind: PurchaseKind;
  status: PurchaseStatus;
  amountCents: number;
  currency: string;
  method: PaymentMethod;
  cardLast4: string | null;
  failureReason: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  createdAt: string;
  movie: PurchaseMovie;
}

export interface Entitlement {
  kind: PurchaseKind;
  expiresAt: string | null;
}

interface PurchaseRow {
  id: number;
  reference: string;
  kind: PurchaseKind;
  status: PurchaseStatus;
  amount_cents: number;
  currency: string;
  method: PaymentMethod;
  card_last4: string | null;
  failure_reason: string | null;
  expires_at: string | null;
  paid_at: string | null;
  created_at: string;
  movie_id: number;
  movie_slug: string;
  movie_title: string;
  movie_poster_url: string | null;
}

const SELECT_COLUMNS = `
  p.id, p.reference, p.kind, p.status, p.amount_cents, p.currency, p.method,
  p.card_last4, p.failure_reason, p.expires_at, p.paid_at, p.created_at,
  m.id AS movie_id, m.slug AS movie_slug, m.title AS movie_title,
  m.poster_url AS movie_poster_url
`;

function toPurchase(row: PurchaseRow): Purchase {
  return {
    id: row.id,
    reference: row.reference,
    kind: row.kind,
    status: row.status,
    amountCents: row.amount_cents,
    currency: row.currency,
    method: row.method,
    cardLast4: row.card_last4,
    failureReason: row.failure_reason,
    expiresAt: row.expires_at,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    movie: {
      id: row.movie_id,
      slug: row.movie_slug,
      title: row.movie_title,
      posterUrl: row.movie_poster_url,
    },
  };
}

export function priceFor(movie: Pick<Movie, 'rentPriceCents' | 'buyPriceCents'>, kind: PurchaseKind): number {
  return kind === 'rent' ? movie.rentPriceCents : movie.buyPriceCents;
}

export function isFree(movie: Pick<Movie, 'buyPriceCents'>): boolean {
  return movie.buyPriceCents <= 0;
}

function newReference(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `PEL-${stamp}-${random}`;
}

export interface CreatePurchaseInput {
  userId: number;
  movieId: number;
  kind: PurchaseKind;
  status: PurchaseStatus;
  amountCents: number;
  method: PaymentMethod;
  cardLast4?: string | null;
  failureReason?: string | null;
}

export function createPurchase(input: CreatePurchaseInput): Purchase {
  const expiresModifier = `+${config.rentDurationHours} hours`;
  const isPaid = input.status === 'paid';
  const expiresAt = isPaid && input.kind === 'rent' ? sqliteDate(expiresModifier) : null;
  const paidAt = isPaid ? sqliteDate('+0 seconds') : null;

  const info = getDb()
    .prepare(
      `INSERT INTO purchases (
         reference, user_id, movie_id, kind, status, amount_cents, currency,
         method, card_last4, failure_reason, expires_at, paid_at
       ) VALUES (
         @reference, @userId, @movieId, @kind, @status, @amountCents, @currency,
         @method, @cardLast4, @failureReason, @expiresAt, @paidAt
       )`,
    )
    .run({
      reference: newReference(),
      userId: input.userId,
      movieId: input.movieId,
      kind: input.kind,
      status: input.status,
      amountCents: input.amountCents,
      currency: config.currency,
      method: input.method,
      cardLast4: input.cardLast4 ?? null,
      failureReason: input.failureReason ?? null,
      expiresAt,
      paidAt,
    });

  const purchase = findPurchaseById(Number(info.lastInsertRowid));
  if (!purchase) throw new Error('No se pudo registrar la compra');
  return purchase;
}

/** Fecha UTC con el mismo formato que SQLite (AAAA-MM-DD HH:MM:SS). */
function sqliteDate(modifier: string): string {
  const row = getDb().prepare("SELECT datetime('now', ?) AS value").get(modifier) as {
    value: string;
  };
  return row.value;
}

export function findPurchaseById(id: number): Purchase | null {
  const row = getDb()
    .prepare(
      `SELECT ${SELECT_COLUMNS}
         FROM purchases p
         JOIN movies m ON m.id = p.movie_id
        WHERE p.id = ?`,
    )
    .get(id) as PurchaseRow | undefined;

  return row ? toPurchase(row) : null;
}

export function findPurchaseByReference(reference: string): Purchase | null {
  const row = getDb()
    .prepare(
      `SELECT ${SELECT_COLUMNS}
         FROM purchases p
         JOIN movies m ON m.id = p.movie_id
        WHERE p.reference = ?`,
    )
    .get(reference) as PurchaseRow | undefined;

  return row ? toPurchase(row) : null;
}

export function listPurchasesByUser(userId: number, limit = 100): Purchase[] {
  const rows = getDb()
    .prepare(
      `SELECT ${SELECT_COLUMNS}
         FROM purchases p
         JOIN movies m ON m.id = p.movie_id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT ?`,
    )
    .all(userId, limit) as PurchaseRow[];

  return rows.map(toPurchase);
}

/**
 * Devuelve la compra/alquiler activo del usuario para una pelicula.
 * Una compra ('buy') nunca caduca; un alquiler caduca a las N horas.
 */
export function activeEntitlement(userId: number, movieId: number): Entitlement | null {
  const row = getDb()
    .prepare(
      `SELECT kind, expires_at
         FROM purchases
        WHERE user_id = ?
          AND movie_id = ?
          AND status = 'paid'
          AND (kind = 'buy' OR (expires_at IS NOT NULL AND expires_at > datetime('now')))
        ORDER BY (kind = 'buy') DESC, created_at DESC
        LIMIT 1`,
    )
    .get(userId, movieId) as { kind: PurchaseKind; expires_at: string | null } | undefined;

  return row ? { kind: row.kind, expiresAt: row.expires_at } : null;
}

export interface PaymentStats {
  revenueCents: number;
  paidCount: number;
  rentCount: number;
  buyCount: number;
  failedCount: number;
  recent: Purchase[];
}

export function paymentStats(recentLimit = 5): PaymentStats {
  const row = getDb()
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_cents ELSE 0 END), 0) AS revenueCents,
         COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) AS paidCount,
         COALESCE(SUM(CASE WHEN status = 'paid' AND kind = 'rent' THEN 1 ELSE 0 END), 0) AS rentCount,
         COALESCE(SUM(CASE WHEN status = 'paid' AND kind = 'buy' THEN 1 ELSE 0 END), 0) AS buyCount,
         COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) AS failedCount
       FROM purchases`,
    )
    .get() as Omit<PaymentStats, 'recent'>;

  const recentRows = getDb()
    .prepare(
      `SELECT ${SELECT_COLUMNS}
         FROM purchases p
         JOIN movies m ON m.id = p.movie_id
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT ?`,
    )
    .all(recentLimit) as PurchaseRow[];

  return { ...row, recent: recentRows.map(toPurchase) };
}

export function countPurchases(): number {
  const row = getDb().prepare('SELECT COUNT(*) AS total FROM purchases').get() as {
    total: number;
  };
  return row.total;
}
