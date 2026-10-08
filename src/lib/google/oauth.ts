import 'server-only';
import { decodeJwt } from 'jose';
import { GOOGLE_SCOPES, readGoogleConfig, type GoogleConfig } from './config';
import { loadConnection, saveConnection } from './tokens';

// Signing Candy in once (connect → Google → callback), then trading his
// refresh token for short-lived access tokens whenever the site calls
// Google. Plain fetch against Google's endpoints: the three calls the site
// makes don't warrant Google's whole client library.

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

/** Google isn't set up here, or Candy hasn't signed in yet. */
export class GoogleNotConnectedError extends Error {
  constructor(why: string) {
    super(`Google isn't connected: ${why}.`);
    this.name = 'GoogleNotConnectedError';
  }
}

/** Google answered with an error. */
export class GoogleRequestError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string
  ) {
    super(`Google answered ${status}: ${detail.slice(0, 300)}`);
    this.name = 'GoogleRequestError';
  }
}

export function requireGoogleConfig(): GoogleConfig {
  const config = readGoogleConfig();
  if (!config) throw new GoogleNotConnectedError('its settings are missing');
  return config;
}

export function consentUrl(
  config: GoogleConfig,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPES.join(' '),
    // A refresh token every time, so connecting again replaces a revoked one.
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'false',
    state
  });
  return `${AUTH_URL}?${params}`;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

async function tokenRequest(body: Record<string, string>) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
    cache: 'no-store'
  });
  if (!response.ok)
    throw new GoogleRequestError(response.status, await response.text());
  return (await response.json()) as TokenResponse;
}

/** Finishes the sign-in: keeps the refresh token, says whose account it is. */
export async function completeConnection(
  config: GoogleConfig,
  code: string,
  redirectUri: string
): Promise<{ email: string; missing: string[] }> {
  const tokens = await tokenRequest({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });
  if (!tokens.refresh_token)
    throw new GoogleRequestError(400, 'No refresh token came back.');
  // The id token came straight from Google over TLS, in answer to this
  // request, so reading it without checking its signature is safe here.
  const claims = tokens.id_token ? decodeJwt(tokens.id_token) : {};
  const email = typeof claims.email === 'string' ? claims.email : '';
  if (!email) throw new GoogleRequestError(400, 'No email came back.');

  const granted = new Set((tokens.scope ?? '').split(' '));
  const missing = GOOGLE_SCOPES.filter(
    (scope) => scope.startsWith('https://') && !granted.has(scope)
  );
  await saveConnection(
    { email, refreshToken: tokens.refresh_token, scope: tokens.scope ?? '' },
    config.tokenKey
  );
  cached().token = undefined;
  return { email, missing };
}

interface CachedToken {
  value: string;
  email: string;
  expiresAt: number;
}

const store = globalThis as typeof globalThis & {
  __candyHeistGoogle?: { token?: CachedToken };
};
const cached = () => (store.__candyHeistGoogle ??= {});

/** An access token for Candy's account, and the address it belongs to. */
export async function googleAccess(): Promise<{
  token: string;
  email: string;
}> {
  const config = requireGoogleConfig();
  const hit = cached().token;
  // A minute's margin, so a token never expires mid-request.
  if (hit && hit.expiresAt - 60_000 > Date.now())
    return { token: hit.value, email: hit.email };

  const connection = await loadConnection(config.tokenKey);
  if (!connection) throw new GoogleNotConnectedError('Candy has not signed in');
  const tokens = await tokenRequest({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: connection.refreshToken,
    grant_type: 'refresh_token'
  });
  cached().token = {
    value: tokens.access_token,
    email: connection.email,
    expiresAt: Date.now() + tokens.expires_in * 1000
  };
  return { token: tokens.access_token, email: connection.email };
}

/** Whether Candy's account is connected, without calling Google. */
export async function googleConnected(): Promise<boolean> {
  const config = readGoogleConfig();
  if (!config) return false;
  try {
    return (await loadConnection(config.tokenKey)) !== null;
  } catch {
    return false;
  }
}

/** A call to a Google API as Candy. */
export async function googleFetch(
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  const { token } = await googleAccess();
  const response = await fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      authorization: `Bearer ${token}`,
      'content-type': 'application/json'
    },
    cache: 'no-store'
  });
  return response;
}
