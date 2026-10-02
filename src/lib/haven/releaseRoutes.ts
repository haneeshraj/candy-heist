import 'server-only';
import { revalidateReleases } from '@/lib/releases/revalidate';
import type { ReleasesOutcome } from '@/lib/releases/store';
import type { ReleasesSnapshot } from '@/lib/releases/model';
import { admitHaven, havenFailure, havenJson } from './guard';

// What every releases route does around its one call to the store: let in
// only Candy Haven's two accounts, read the body, answer with what's on the
// site (or why not), and when the site changed, have its pages made again.

export interface IdContext {
  params: Promise<{ id: string }>;
}

/** A body of raw bytes (an image): the types it may be, and how large. */
export interface BytesBody {
  types: readonly string[];
  /** In bytes. */
  limit: number;
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

const tooLarge = () => havenJson({ error: 'too_large' }, 413);

/**
 * The body's bytes, or the answer to give instead: the wrong type, or
 * more than the limit. A length said up front is believed for refusing;
 * otherwise (or when it's wrong) the body is counted as it comes.
 */
async function readBytes(
  request: Request,
  { types, limit }: BytesBody
): Promise<Buffer | Response> {
  const type = (request.headers.get('content-type') ?? '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (!types.includes(type))
    return havenJson({ error: 'unsupported_type' }, 415);
  if (Number(request.headers.get('content-length')) > limit) return tooLarge();
  if (!request.body) return Buffer.alloc(0);

  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = request.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return tooLarge();
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

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
