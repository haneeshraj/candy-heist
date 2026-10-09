import 'server-only';
import { revalidateServices } from '@/lib/services/revalidate';
import type { ServicesOutcome } from '@/lib/services/store';
import { readBytes, type BytesBody } from './bytes';
import { admitHaven, havenFailure, havenJson } from './guard';

// What every services route does around its one call: let in only Candy
// Haven's two accounts, read the body, answer with the result (or why
// not), and when the site's services changed, have its pages made again.

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

export async function servicesRoute<T>(
  request: Request,
  run: (uid: string, body: unknown) => Promise<ServicesOutcome<T>>,
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
    const outcome = await run(admitted.uid, body);
    if (!outcome.ok) return havenJson(outcome.body, outcome.status);
    if (outcome.siteChanged) revalidateServices();
    return havenJson(outcome.body);
  } catch (error) {
    return havenFailure(error);
  }
}
