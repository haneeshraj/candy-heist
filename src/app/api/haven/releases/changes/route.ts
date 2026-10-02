import { releasesRoute } from '@/lib/haven/releaseRoutes';
import { applyChanges } from '@/lib/releases/store';

// Several changes from RELEASES in one request, as { add, update,
// visibility, shelf }: made together, or (when one can't be) none of them.
// The answer carries the site's id for each new release's ref.
export function POST(request: Request) {
  return releasesRoute(request, (uid, body) => applyChanges(body, uid), {
    body: true
  });
}
