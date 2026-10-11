import 'server-only';
import type { ConsultOutcome } from '@/lib/consult/store';
import { admitHaven, havenFailure, havenJson, havenNoContent } from './guard';

// What every consultation route does around its one call to the store: let
// in only Candy Haven's two accounts, read the body, and answer with the
// result, or why not. Nothing here is cached or prebuilt, so there are no
// pages to remake afterwards.

export interface IdContext {
  params: Promise<{ id: string }>;
}

export async function consultRoute<T>(
  request: Request,
  run: (uid: string, body: unknown) => Promise<ConsultOutcome<T>>,
  options: { body?: boolean } = {}
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
    return outcome.body === null ? havenNoContent() : havenJson(outcome.body);
  } catch (error) {
    return havenFailure(error);
  }
}
