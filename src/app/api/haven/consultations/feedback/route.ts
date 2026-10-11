import { feedbackSince } from '@/lib/consult/store';
import { admitHaven, havenFailure, havenJson } from '@/lib/haven/guard';

// Candy Haven's check-in for feedback: everything producers sent since the
// last one it saw, on links still open. With no `since`, from the start.
export async function GET(request: Request) {
  const admitted = await admitHaven(request);
  if ('response' in admitted) return admitted.response;

  const raw = new URL(request.url).searchParams.get('since');
  const since = raw ? new Date(raw) : new Date(0);
  if (Number.isNaN(since.getTime()))
    return havenJson({ error: 'bad_since' }, 400);

  try {
    return havenJson(await feedbackSince(since));
  } catch (error) {
    return havenFailure(error);
  }
}
