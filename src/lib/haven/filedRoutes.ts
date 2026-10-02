import 'server-only';
import type { DeletedKind } from '@/lib/db/collections';
import { deleteFiled, parseId } from '@/lib/inbox/store';
import { admitHaven, havenFailure, havenJson, havenNoContent } from './guard';

// What Candy Haven can do to a filed message or enquiry: delete it. Where it
// stands is Haven's own business and never comes back here. The two kinds
// share this; the route files only say which kind they're for.

export interface FiledContext {
  params: Promise<{ id: string }>;
}

export async function deleteFiledRoute(
  kind: DeletedKind,
  request: Request,
  { params }: FiledContext
): Promise<Response> {
  const admitted = await admitHaven(request);
  if ('response' in admitted) return admitted.response;

  const id = parseId((await params).id);
  if (!id) return havenJson({ error: 'not_found' }, 404);

  try {
    await deleteFiled(kind, id);
    return havenNoContent();
  } catch (error) {
    return havenFailure(error);
  }
}
