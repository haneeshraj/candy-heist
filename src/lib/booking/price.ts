import type { ServiceKind } from '@/content/services/catalogue';

// What's paid when. A commission starts with half its price upfront and
// the rest is due on delivery; a 1-1 session is paid in full when it's
// booked. Worked out in cents, so halves of odd prices stay exact: the odd
// cent goes on the advance.

/** The share of a commission's price paid upfront. */
export const COMMISSION_ADVANCE = 0.5;

export interface Charge {
  /** The full price, in cents. */
  total: number;
  /** Paid now, in cents. */
  now: number;
  /** Due on delivery, in cents: a commission's other half, else 0. */
  later: number;
}

export function chargeFor(kind: ServiceKind, price: number): Charge {
  const total = Math.round(price * 100);
  const now =
    kind === 'commission' ? Math.ceil(total * COMMISSION_ADVANCE) : total;
  return { total, now, later: total - now };
}

/** "$50", or "$12.50" when there are cents. */
export function formatAmount(cents: number) {
  const whole = cents % 100 === 0;
  return `$${(cents / 100).toLocaleString('en-CA', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2
  })}`;
}

/** The amounts as shown, or the placeholder while the price is unset. */
export interface Amounts {
  price: string;
  now: string;
  /** null for a session: nothing is left to pay. */
  later: string | null;
}

export function amountsFor(
  kind: ServiceKind,
  price: number | undefined,
  placeholder: string
): Amounts {
  const later = kind === 'commission';
  if (price === undefined)
    return {
      price: placeholder,
      now: placeholder,
      later: later ? placeholder : null
    };
  const charge = chargeFor(kind, price);
  return {
    price: formatAmount(charge.total),
    now: formatAmount(charge.now),
    later: later ? formatAmount(charge.later) : null
  };
}
