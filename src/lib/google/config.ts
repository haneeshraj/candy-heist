// Candy's Google account, for the booking side of the site: his calendar
// says when he's busy and holds each session with its Meet link, and his
// Gmail sends the receipts. Read from the environment, never the code:
//
//   GOOGLE_CLIENT_ID      the OAuth client, from the Google Cloud console
//   GOOGLE_CLIENT_SECRET  its secret
//   GOOGLE_CONNECT_KEY    a long random string; /api/google/connect?key=…
//                         is how Candy signs in, and nobody without it can
//   GOOGLE_TOKEN_KEY      32 random bytes, base64: encrypts his sign-in at
//                         rest in the database

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  connectKey: string;
  tokenKey: Buffer;
}

/** The settings, or null while any is missing or the token key isn't 32 bytes. */
export function readGoogleConfig(
  env: Record<string, string | undefined> = process.env
): GoogleConfig | null {
  const clientId = env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  const connectKey = env.GOOGLE_CONNECT_KEY?.trim();
  const rawKey = env.GOOGLE_TOKEN_KEY?.trim();
  if (!clientId || !clientSecret || !connectKey || !rawKey) return null;
  const tokenKey = Buffer.from(rawKey, 'base64');
  if (tokenKey.length !== 32) return null;
  return { clientId, clientSecret, connectKey, tokenKey };
}

/** The cookie that carries the sign-in's state from connect to callback. */
export const STATE_COOKIE = 'google_connect_state';

/**
 * What Candy's sign-in allows, and nothing more: see when he's busy (not
 * what his events are), add the sessions' events, send email as him.
 */
export const GOOGLE_SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/calendar.freebusy',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.send'
] as const;
