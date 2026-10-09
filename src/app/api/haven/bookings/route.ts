import { bookingChangesSince } from '@/lib/booking/server/haven';
import { admitHaven, havenFailure, havenJson } from '@/lib/haven/guard';

// Candy Haven's check-in for "Book me as a music producer": every paid or
// cancelled booking changed at or after ?since= (an ISO instant), each
// with its invoice, oldest change first. Haven passes the answer's cursor
// back next time.

export async function GET(request: Request) {
  const admitted = await admitHaven(request);
  if ('response' in admitted) return admitted.response;

  const raw = new URL(request.url).searchParams.get('since');
  const since = raw ? new Date(raw) : new Date(0);
  if (Number.isNaN(since.getTime()))
    return havenJson({ error: 'bad_since' }, 400);

  try {
    return havenJson(await bookingChangesSince(since));
  } catch (error) {
    return havenFailure(error);
  }
}
