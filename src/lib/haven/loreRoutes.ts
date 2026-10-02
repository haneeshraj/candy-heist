import 'server-only';
import { revalidateLore } from '@/lib/lore/revalidate';
import type { LoreOutcome } from '@/lib/lore/store';
import { admitHaven, havenFailure, havenJson } from './guard';

// What every lore route does around its one call to the store: let in
// only Candy Haven's two accounts, read the body, answer with the whole
// lore (or why not), and when the site's lore changed, have its pages
// made again.

export interface IdContext {
  params: Promise<{ id: string }>;
}

interface Options {
  /** Whether the route reads a JSON body. */
  body?: boolean;
}

export async function loreRoute(
  request: Request,
  run: (uid: string, body: unknown) => Promise<LoreOutcome>,
  options: Options = {}
): Promise<Response> {
  const admitted = await admitHaven(request);
  if ('response' in admitted) return admitted.response;

  let body: unknown;
  if (options.body) {
    try {
      body = await request.json();
    } catch {
      return havenJson({ error: 'bad_body' }, 400);
    }
  }

  try {
    const outcome = await run(admitted.uid, body);
    if (!outcome.ok) return havenJson(outcome.body, outcome.status);
    if (outcome.siteChanged) revalidateLore();
    return havenJson(outcome.snapshot);
  } catch (error) {
    return havenFailure(error);
  }
}
