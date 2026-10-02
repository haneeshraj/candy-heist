import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

// Who may use Candy Haven's API: someone signed in to Candy Haven with one
// of the two accounts it has, Candy's and the developer's.
//
// Haven sends the Firebase ID token its sign-in hands it. The token is
// signed by Google, so it's checked against Google's published keys: one
// that wasn't issued for this project, has run out, or was made by anyone
// but Google is refused. A real token for any other account is refused
// too, because the account has to be one of the two by its id.
//
// Checking needs the project's id and nothing secret, which is why Haven
// never holds the database's password, only its sign-in.

export const GOOGLE_KEYS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

export interface HavenAuthConfig {
  projectId: string;
  /** The Firebase account ids allowed in. */
  allowedUids: readonly string[];
}

/**
 * The API's settings, or null while they're missing:
 *
 *   FIREBASE_PROJECT_ID   the Firebase project Candy Haven signs in to
 *   HAVEN_ALLOWED_UIDS    the two account ids, separated by commas
 */
export function readHavenAuthConfig(
  env: Record<string, string | undefined>
): HavenAuthConfig | null {
  const projectId = env.FIREBASE_PROJECT_ID?.trim();
  const allowedUids = (env.HAVEN_ALLOWED_UIDS ?? '')
    .split(',')
    .map((uid) => uid.trim())
    .filter(Boolean);
  return projectId && allowedUids.length ? { projectId, allowedUids } : null;
}

let googleKeys: JWTVerifyGetKey | null = null;

/** Google's keys, fetched when first needed and kept, as Google advises. */
export function getGoogleKeys(): JWTVerifyGetKey {
  googleKeys ??= createRemoteJWKSet(new URL(GOOGLE_KEYS_URL));
  return googleKeys;
}

export type HavenAuthVerdict =
  | { ok: true; uid: string }
  /** 401: no sign-in, or not a real one. 403: a real one, not allowed in. */
  | { ok: false; status: 401 | 403 };

/** How far a token's sign-in time may sit ahead of this clock. */
const CLOCK_SKEW_SECONDS = 60;

export async function verifyHavenToken(
  authorization: string | null,
  config: HavenAuthConfig,
  keys: JWTVerifyGetKey,
  now: Date = new Date()
): Promise<HavenAuthVerdict> {
  const match = /^Bearer\s+([\w-]+\.[\w-]+\.[\w-]+)$/i.exec(
    authorization?.trim() ?? ''
  );
  if (!match) return { ok: false, status: 401 };

  try {
    const { payload } = await jwtVerify(match[1], keys, {
      issuer: `https://securetoken.google.com/${config.projectId}`,
      audience: config.projectId,
      algorithms: ['RS256'],
      currentDate: now,
      clockTolerance: CLOCK_SKEW_SECONDS
    });
    const uid = typeof payload.sub === 'string' ? payload.sub : '';
    const signedInAt =
      typeof payload.auth_time === 'number' ? payload.auth_time : Number.NaN;
    if (!uid || !(signedInAt <= now.getTime() / 1000 + CLOCK_SKEW_SECONDS))
      return { ok: false, status: 401 };
    return config.allowedUids.includes(uid)
      ? { ok: true, uid }
      : { ok: false, status: 403 };
  } catch {
    return { ok: false, status: 401 };
  }
}
