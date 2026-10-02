// Quiet checks against bots, so a visitor never meets a "prove you're
// human" test. A form sent by a bot is answered as if it went through, and
// isn't kept: telling a bot it was caught only teaches it what to change.
//
// The form and the server both read this file, so it holds nothing that
// only runs on the server.

/**
 * A field people never see and bots fill in. Named like something a form
 * would ask for, because a field called "trap" is one a bot learns to skip.
 */
export const TRAP_FIELD = 'website';

/** Faster than this from opening the form to sending it, and nobody typed it. */
export const MIN_FILL_MS = 3000;

/** What a form sends alongside its fields, for these checks. */
export interface FormCheck {
  /** Whatever ended up in the hidden field. */
  trap: string;
  /** When the form was opened, by the visitor's clock. */
  startedAt: number;
}

export function looksAutomated(
  check: unknown,
  sentAt: number = Date.now()
): boolean {
  if (!check || typeof check !== 'object') return true;
  const { trap, startedAt } = check as Partial<FormCheck>;
  if (typeof trap !== 'string' || trap.trim() !== '') return true;
  if (typeof startedAt !== 'number' || !Number.isFinite(startedAt)) return true;
  return sentAt - startedAt < MIN_FILL_MS;
}
