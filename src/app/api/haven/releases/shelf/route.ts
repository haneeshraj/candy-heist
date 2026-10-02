import { releasesRoute } from '@/lib/haven/releaseRoutes';
import { setShelf } from '@/lib/releases/store';

// The home page shelf: up to eight releases, in order, as { ids }.
export function PUT(request: Request) {
  return releasesRoute(request, (_uid, body) => setShelf(body), {
    body: true
  });
}
