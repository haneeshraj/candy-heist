import { releasesRoute } from '@/lib/haven/releaseRoutes';
import { publishEverything } from '@/lib/releases/store';

// "Publish everything": every release Haven has, at once, and the site
// switched from its own releases to Haven's for good.
export function POST(request: Request) {
  return releasesRoute(request, (uid, body) => publishEverything(body, uid), {
    body: true
  });
}
