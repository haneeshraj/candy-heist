import 'server-only';
import { DatabaseUnavailableError } from '@/lib/db/client';
import { withinHourlyLimit } from '@/lib/forms/limits';
import { getGoogleKeys, readHavenAuthConfig, verifyHavenToken } from './auth';

// The door to Candy Haven's API. Every route asks it first, and nothing
// is read or written until it says yes.

/** Answers Haven can't cache: everything here is somebody's private data. */
export function havenJson(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  });
}

export const havenNoContent = (): Response =>
  new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });

/** Failed sign-ins one address gets an hour before it's shut out. */
const FAILED_PER_HOUR = 30;

/**
 * The account behind a request, or the answer to give instead.
 *
 * Only failed attempts count towards the limit, so Haven checking in once
 * a minute costs nothing, while anyone trying token after token is shut
 * out for the hour.
 */
export async function admitHaven(
  request: Request
): Promise<{ uid: string } | { response: Response }> {
  const config = readHavenAuthConfig(process.env);
  if (!config) return { response: havenJson({ error: 'not_configured' }, 503) };

  const verdict = await verifyHavenToken(
    request.headers.get('authorization'),
    config,
    getGoogleKeys()
  );
  if (verdict.ok) return { uid: verdict.uid };

  try {
    if (!(await withinHourlyLimit('haven-api-refused', FAILED_PER_HOUR)))
      return { response: havenJson({ error: 'too_many_attempts' }, 429) };
  } catch (error) {
    if (!(error instanceof DatabaseUnavailableError)) throw error;
  }
  return {
    response: havenJson(
      { error: verdict.status === 401 ? 'unauthorized' : 'forbidden' },
      verdict.status
    )
  };
}

/** A database that's down or missing, as an answer rather than a crash. */
export function havenFailure(error: unknown): Response {
  if (error instanceof DatabaseUnavailableError)
    return havenJson({ error: 'database_unavailable' }, 503);
  console.error('Candy Haven API request failed.', error);
  return havenJson({ error: 'failed' }, 500);
}
