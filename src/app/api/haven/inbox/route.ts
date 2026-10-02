import { admitHaven, havenFailure, havenJson } from '@/lib/haven/guard';
import { changesSince } from '@/lib/inbox/store';

// Candy Haven's check-in: every message, enquiry and deletion since the
// last one it saw. With no `since`, everything from the start.
export async function GET(request: Request) {
  const admitted = await admitHaven(request);
  if ('response' in admitted) return admitted.response;

  const raw = new URL(request.url).searchParams.get('since');
  const since = raw ? new Date(raw) : new Date(0);
  if (Number.isNaN(since.getTime()))
    return havenJson({ error: 'bad_since' }, 400);

  try {
    return havenJson(await changesSince(since));
  } catch (error) {
    return havenFailure(error);
  }
}
