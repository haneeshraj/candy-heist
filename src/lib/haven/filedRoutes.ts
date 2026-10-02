import 'server-only';
import type { DeletedKind } from '@/lib/db/collections';
import { deleteFiled, parseId, setStatus } from '@/lib/inbox/store';
import type { EnquiryStatus, MessageStatus } from '@/lib/inbox/status';
import { admitHaven, havenFailure, havenJson, havenNoContent } from './guard';

// What Candy Haven can do to a filed message or enquiry: change where it
// stands, or delete it. The two kinds share these, each with its own
// statuses; the route files only say which kind they're for.

export interface FiledContext {
  params: Promise<{ id: string }>;
}

type IsStatus = (value: unknown) => value is MessageStatus | EnquiryStatus;

export async function patchFiled(
  kind: DeletedKind,
  isStatus: IsStatus,
  request: Request,
  { params }: FiledContext
): Promise<Response> {
  const admitted = await admitHaven(request);
  if ('response' in admitted) return admitted.response;

  const id = parseId((await params).id);
  if (!id) return havenJson({ error: 'not_found' }, 404);

  let status: unknown;
  try {
    status = ((await request.json()) as { status?: unknown })?.status;
  } catch {
    return havenJson({ error: 'bad_body' }, 400);
  }
  if (!isStatus(status)) return havenJson({ error: 'bad_status' }, 400);

  try {
    return (await setStatus(kind, id, status))
      ? havenNoContent()
      : havenJson({ error: 'not_found' }, 404);
  } catch (error) {
    return havenFailure(error);
  }
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
