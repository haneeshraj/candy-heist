import { releasesRoute, type IdContext } from '@/lib/haven/releaseRoutes';
import { setVisibility } from '@/lib/releases/store';

// Hidden by hand ({ shown: false }), or not (true, or null): then its
// status and date decide, and a draft waits for its day.
export async function PUT(request: Request, { params }: IdContext) {
  const { id } = await params;
  return releasesRoute(request, (uid, body) => setVisibility(id, body, uid), {
    body: true
  });
}
