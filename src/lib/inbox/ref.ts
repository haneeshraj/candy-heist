import { randomInt } from 'node:crypto';

// The short code a message, an enquiry or a booking is filed under:
// MSG-7KQ2FD, DJ-H3XN8P, CH-K3P2Q8.
// Six characters from an alphabet without the ones that read alike (0 and
// O, 1 and I and L), so it can be read out over the phone. That's about a
// billion codes; the database refuses a repeat and the store draws again.

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const LENGTH = 6;

export type RefPrefix = 'MSG' | 'DJ' | 'CH';

export function newRef(prefix: RefPrefix): string {
  let code = '';
  for (let i = 0; i < LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return `${prefix}-${code}`;
}

export const REF_PATTERN = /^(MSG|DJ)-[2-9A-HJKMNP-Z]{6}$/;

/** A booking's reference: CH-K3P2Q8. */
export const BOOKING_REF_PATTERN = /^CH-[2-9A-HJKMNP-Z]{6}$/;
