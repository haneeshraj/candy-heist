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

interface Options {
  /** Whether the route reads a JSON body. */
  body?: boolean;
}

export async function releasesRoute<T extends ReleasesSnapshot>(
  request: Request,
  run: (uid: string, body: unknown) => Promise<ReleasesOutcome<T>>,
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
    if (outcome.siteChanged) revalidateReleases();
    return havenJson(outcome.snapshot);
  } catch (error) {
    return havenFailure(error);
  }
}
