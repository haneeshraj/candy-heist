import 'server-only';
import type { BookingActionOutcome } from '@/lib/booking/server/haven';
import { BOOKING_REF_PATTERN } from '@/lib/inbox/ref';
import { admitHaven, havenFailure, havenJson } from './guard';

// What moving or cancelling a booking does around its one call: let in
// only Candy Haven's two accounts, check the reference, read the body,
// and answer with the booking as it now stands (or why not). Nothing
// cached changes: the open times are read fresh on every visit.

export interface RefContext {
  params: Promise<{ ref: string }>;
}

export async function bookingRoute(
  request: Request,
  { params }: RefContext,
  run: (
    ref: string,
    uid: string,
    body: unknown
  ) => Promise<BookingActionOutcome>
): Promise<Response> {
  const admitted = await admitHaven(request);
  if ('response' in admitted) return admitted.response;

  const { ref } = await params;
  if (!BOOKING_REF_PATTERN.test(ref))
    return havenJson({ error: 'not_found' }, 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return havenJson({ error: 'bad_body' }, 400);
  }

  try {
    const outcome = await run(ref, admitted.uid, body);
    return outcome.ok
      ? havenJson(outcome.body)
      : havenJson(outcome.body, outcome.status);
  } catch (error) {
    return havenFailure(error);
  }
}
