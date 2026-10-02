import { randomInt } from 'node:crypto';

// The short code a message or an enquiry is filed under: MSG-7KQ2FD.
// Six characters from an alphabet without the ones that read alike (0 and
// O, 1 and I and L), so it can be read out over the phone. That's about a
// billion codes; the database refuses a repeat and the store draws again.

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const LENGTH = 6;

export type RefPrefix = 'MSG' | 'DJ';

export function newRef(prefix: RefPrefix): string {
  let code = '';
  for (let i = 0; i < LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return `${prefix}-${code}`;
}

export const REF_PATTERN = /^(MSG|DJ)-[2-9A-HJKMNP-Z]{6}$/;
