import { admitHaven, havenFailure, havenJson } from '@/lib/haven/guard';
import { releasesRoute } from '@/lib/haven/releaseRoutes';
import { publishRelease, releasesSnapshot } from '@/lib/releases/store';

// Candy Haven's RELEASES. GET: every release on the site, whether it's
// shown, the shelf, and whether the site shows Haven's releases yet.
// POST: a release this copy of Haven hasn't sent before, as { ref, fields };
// the answer carries the site's id for Haven's ref.
export async function GET(request: Request) {
  const admitted = await admitHaven(request);
  if ('response' in admitted) return admitted.response;
  try {
    return havenJson(await releasesSnapshot());
  } catch (error) {
    return havenFailure(error);
  }
}

export function POST(request: Request) {
  return releasesRoute(request, (uid, body) => publishRelease(body, uid), {
    body: true
  });
}
