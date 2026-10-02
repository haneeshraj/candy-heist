import { releasesRoute, type IdContext } from '@/lib/haven/releaseRoutes';
import { setVisibility } from '@/lib/releases/store';

// Shown, hidden, or (null) as its status says: out shows, not out yet doesn't.
export async function PUT(request: Request, { params }: IdContext) {
  const { id } = await params;
  return releasesRoute(request, (uid, body) => setVisibility(id, body, uid), {
    body: true
  });
}
