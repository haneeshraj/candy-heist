import 'server-only';
import { revalidateReleases } from '@/lib/releases/revalidate';
import type { ReleasesOutcome } from '@/lib/releases/store';
import type { ReleasesSnapshot } from '@/lib/releases/model';
import { readBytes, type BytesBody } from './bytes';
import { admitHaven, havenFailure, havenJson } from './guard';

export type { BytesBody } from './bytes';

// What every releases route does around its one call to the store: let in
// only Candy Haven's two accounts, read the body, answer with what's on the
// site (or why not), and when the site changed, have its pages made again.

export interface IdContext {
  params: Promise<{ id: string }>;
}

interface Options {
  /** Whether the route reads a JSON body. */
  body?: boolean;
  /** Whether it reads raw bytes instead, handed on as a Buffer. */
  bytes?: BytesBody;
  /**
   * What the route needs set up beyond the database: the answer to give
   * while it isn't, or null. Asked once Haven is let in, before the body
   * is read.
   */
  unavailable?: () => Response | null;
}

type Run<T extends ReleasesSnapshot, B> = (
  uid: string,
  body: B
) => Promise<ReleasesOutcome<T>>;

export function releasesRoute<T extends ReleasesSnapshot>(
  request: Request,
  run: Run<T, Buffer>,
  options: Options & { bytes: BytesBody }
): Promise<Response>;
export function releasesRoute<T extends ReleasesSnapshot>(
  request: Request,
  run: Run<T, unknown>,
  options?: Options
): Promise<Response>;
export async function releasesRoute<T extends ReleasesSnapshot>(
  request: Request,
  run: Run<T, never>,
  options: Options = {}
): Promise<Response> {
  const admitted = await admitHaven(request);
  if ('response' in admitted) return admitted.response;

  const unavailable = options.unavailable?.();
  if (unavailable) return unavailable;

  let body: unknown;
  if (options.bytes) {
    try {
      body = await readBytes(request, options.bytes);
    } catch {
      return havenJson({ error: 'bad_body' }, 400);
    }
    if (body instanceof Response) return body;
  } else if (options.body) {
    try {
      body = await request.json();
    } catch {
      return havenJson({ error: 'bad_body' }, 400);
    }
  }

  try {
    // The overloads above tie the body to what the route asked for.
    const outcome = await (run as Run<T, unknown>)(admitted.uid, body);
    if (!outcome.ok) return havenJson(outcome.body, outcome.status);
    if (outcome.siteChanged) revalidateReleases();
    return havenJson(outcome.snapshot);
  } catch (error) {
    return havenFailure(error);
  }
}
