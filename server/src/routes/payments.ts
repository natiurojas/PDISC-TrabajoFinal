import { Router } from 'express';
import { findMovieByIdOrSlug } from '../db/moviesRepo.js';
import {
  activeEntitlement,
  createPurchase,
  isFree,
  listPurchasesByUser,
  priceFor,
  type PurchaseKind,
} from '../db/purchasesRepo.js';
import type { Movie } from '../db/types.js';
import { signPlaybackToken, PLAYBACK_TTL_SECONDS } from '../auth/playback.js';
import { config } from '../config.js';
import { ApiError } from '../lib/errors.js';
import { requireParam } from '../lib/query.js';
import { asBody, requireString } from '../lib/validate.js';
import { currentUser, requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/index.js';
import {
  TEST_CARDS,
  simulateCardPayment,
  simulatePaypalPayment,
  type GatewayOutcome,
  type PaymentMethod,
} from '../services/paymentGateway.js';

export const paymentsRouter = Router();

const KINDS: readonly PurchaseKind[] = ['rent', 'buy'];
const METHODS: readonly PaymentMethod[] = ['card', 'paypal'];

function parseKind(value: unknown): PurchaseKind {
  const raw = requireString(value, 'kind', 3, 4).toLowerCase();
  const kind = KINDS.find((entry) => entry === raw);
  if (!kind) throw ApiError.badRequest('El tipo debe ser "rent" (alquilar) o "buy" (comprar)');
  return kind;
}

function parseMethod(value: unknown): PaymentMethod {
  const raw = (typeof value === 'string' ? value : 'card').trim().toLowerCase();
  const method = METHODS.find((entry) => entry === raw);
  if (!method) throw ApiError.badRequest('El metodo de pago debe ser "card" o "paypal"');
  return method;
}

function resolveMovie(idOrSlug: string): Movie {
  const movie = findMovieByIdOrSlug(idOrSlug);
  if (!movie) throw ApiError.notFound(`No existe la pelicula "${idOrSlug}"`);
  return movie;
}

function streamUrlFor(movieId: number, userId: number): string {
  const token = signPlaybackToken(userId, movieId);
  return `/api/movies/${movieId}/stream?t=${encodeURIComponent(token)}`;
}

function isStaff(user: { permissions: string[] }): boolean {
  return user.permissions.includes('movies:write');
}

/* ------------------------------------------------------------------ */
/* Acceso a la pelicula                                                */
/* ------------------------------------------------------------------ */

paymentsRouter.get(
  '/access/:idOrSlug',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const movie = resolveMovie(requireParam(req.params.idOrSlug, 'idOrSlug'));
    const entitlement = activeEntitlement(user.id, movie.id);
    const free = isFree(movie);
    const staff = isStaff(user);

    const owned = staff || free || entitlement !== null;
    const source = staff ? 'staff' : free ? 'free' : entitlement ? 'purchase' : null;

    res.json({
      movie: { id: movie.id, slug: movie.slug, title: movie.title },
      free,
      prices: {
        rentCents: movie.rentPriceCents,
        buyCents: movie.buyPriceCents,
        currency: config.currency,
      },
      entitlement: entitlement
        ? {
            owned,
            kind: entitlement.kind,
            expiresAt: entitlement.expiresAt,
            source,
          }
        : {
            owned,
            kind: null,
            expiresAt: null,
            source,
          },
      streamUrl: owned ? streamUrlFor(movie.id, user.id) : null,
      playbackTtlSeconds: PLAYBACK_TTL_SECONDS,
      rentDurationHours: config.rentDurationHours,
    });
  }),
);

/* ------------------------------------------------------------------ */
/* Pasarela de prueba                                                  */
/* ------------------------------------------------------------------ */

paymentsRouter.get('/test-cards', (_req, res) => {
  res.json({ items: TEST_CARDS });
});

/* ------------------------------------------------------------------ */
/* Checkout simulado                                                   */
/* ------------------------------------------------------------------ */

paymentsRouter.post(
  '/checkout',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const body = asBody(req.body);

    const idOrSlug = requireString(body.idOrSlug ?? body.slug, 'idOrSlug', 1, 120);
    const kind = parseKind(body.kind);
    const method = parseMethod(body.method);
    const movie = resolveMovie(idOrSlug);

    if (isFree(movie)) {
      throw ApiError.badRequest('Esta pelicula es gratuita: no necesitas realizar ningun pago');
    }

    const amountCents = priceFor(movie, kind);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      throw new ApiError(
        409,
        'not_for_sale',
        kind === 'rent'
          ? 'Esta pelicula no esta disponible para alquiler'
          : 'Esta pelicula no esta disponible para compra',
      );
    }

    // Evitamos cobrar dos veces por lo mismo.
    const current = activeEntitlement(user.id, movie.id);
    if (current) {
      if (current.kind === 'buy') {
        throw new ApiError(409, 'already_owned', 'Ya tienes esta pelicula en propiedad');
      }
      if (kind === 'rent') {
        throw new ApiError(409, 'already_rented', 'Ya tienes un alquiler activo de esta pelicula');
      }
    }

    let outcome: GatewayOutcome;
    if (method === 'paypal') {
      outcome = simulatePaypalPayment(body.paypalEmail);
    } else {
      outcome = simulateCardPayment({
        number: body.cardNumber,
        name: body.cardName,
        expiry: body.cardExpiry,
        cvv: body.cardCvv,
      });
    }

    const purchase = createPurchase({
      userId: user.id,
      movieId: movie.id,
      kind,
      status: outcome.status,
      amountCents,
      method: outcome.method,
      cardLast4: outcome.cardLast4,
      failureReason: outcome.failureReason,
    });

    const paid = purchase.status === 'paid';
    res.status(201).json({
      ok: paid,
      purchase,
      streamUrl: paid ? streamUrlFor(movie.id, user.id) : null,
      message: paid
        ? kind === 'rent'
          ? `Alquiler confirmado durante ${config.rentDurationHours} horas`
          : 'Compra confirmada: la pelicula ya es tuya'
        : (purchase.failureReason ?? 'El pago no se ha podido completar'),
    });
  }),
);

/* ------------------------------------------------------------------ */
/* Historial del usuario                                               */
/* ------------------------------------------------------------------ */

paymentsRouter.get(
  '/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    res.json({ items: listPurchasesByUser(user.id) });
  }),
);
