import { ApiError } from '../lib/errors.js';

export type PaymentMethod = 'card' | 'paypal';

export interface GatewayOutcome {
  status: 'paid' | 'failed';
  method: PaymentMethod;
  cardLast4: string | null;
  failureReason: string | null;
}

export interface TestCard {
  number: string;
  brand: string;
  outcome: 'paid' | 'failed';
  label: string;
}

/**
 * Tarjetas de prueba que entiende la pasarela simulada. Cualquier otro
 * numero valido (13-19 digitos) tambien se aprueba salvo estas excepciones.
 */
export const TEST_CARDS: TestCard[] = [
  { number: '4242424242424242', brand: 'Visa', outcome: 'paid', label: 'Pago aprobado' },
  { number: '5555555555554444', brand: 'Mastercard', outcome: 'paid', label: 'Pago aprobado' },
  { number: '4000000000000002', brand: 'Visa', outcome: 'failed', label: 'Tarjeta rechazada' },
  { number: '4000000000000069', brand: 'Visa', outcome: 'failed', label: 'Tarjeta caducada' },
];

const DECLINE_NUMBERS = new Set(['4000000000000002', '4000000000000069']);
const EXPIRED_NUMBER = '4000000000000069';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function digitsOnly(value: string): string {
  return value.replace(/[\s-]/g, '');
}

/** Acepta MM/YY y MM/YYYY. Devuelve el primer dia de ese mes. */
function parseExpiry(value: string): Date | null {
  const match = /^(\d{2})\s*\/\s*(\d{2}|\d{4})$/.exec(value.trim());
  if (!match) return null;

  const month = Number.parseInt(match[1] ?? '', 10);
  let year = Number.parseInt(match[2] ?? '', 10);
  if (year < 100) year += 2000;
  if (month < 1 || month > 12) return null;

  // El ultimo dia del mes: una tarjeta caduca al terminar MM/YY.
  const date = new Date(year, month, 1);
  return Number.isNaN(date.getTime()) ? null : date;
}

export interface CardInput {
  number: unknown;
  name: unknown;
  expiry: unknown;
  cvv: unknown;
}

/** Simula el cobro con tarjeta. Lanza ApiError 400 si los datos no son validos. */
export function simulateCardPayment(card: CardInput): GatewayOutcome {
  const number = digitsOnly(String(card.number ?? ''));
  if (!/^\d{13,19}$/.test(number)) {
    throw ApiError.badRequest('El numero de tarjeta debe tener entre 13 y 19 digitos');
  }

  const name = String(card.name ?? '').trim();
  if (name.length < 2) {
    throw ApiError.badRequest('El titular de la tarjeta es obligatorio');
  }

  const expiry = parseExpiry(String(card.expiry ?? ''));
  if (!expiry) {
    throw ApiError.badRequest('La fecha de caducidad debe tener el formato MM/AA');
  }

  if (!/^\d{3,4}$/.test(String(card.cvv ?? ''))) {
    throw ApiError.badRequest('El CVV debe tener 3 o 4 digitos');
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const last4 = number.slice(-4);

  if (number === EXPIRED_NUMBER || expiry <= monthStart) {
    return {
      status: 'failed',
      method: 'card',
      cardLast4: last4,
      failureReason: 'La tarjeta esta caducada',
    };
  }

  if (DECLINE_NUMBERS.has(number)) {
    return {
      status: 'failed',
      method: 'card',
      cardLast4: last4,
      failureReason: 'El banco ha rechazado el pago (fondos insuficientes)',
    };
  }

  return { status: 'paid', method: 'card', cardLast4: last4, failureReason: null };
}

export function simulatePaypalPayment(email: unknown): GatewayOutcome {
  const address = String(email ?? '').trim();
  if (!EMAIL_PATTERN.test(address)) {
    throw ApiError.badRequest('Indica el correo de tu cuenta de PayPal');
  }

  return { status: 'paid', method: 'paypal', cardLast4: null, failureReason: null };
}
