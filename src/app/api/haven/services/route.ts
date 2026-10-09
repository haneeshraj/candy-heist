import { servicesRoute } from '@/lib/haven/servicesRoutes';
import { publishServices, servicesSnapshot } from '@/lib/services/store';

// Candy Haven's SERVICES and the site's "Book me as a music producer".
// GET: what the site offers now, and the hours (its own files, until the
// first publish). PUT: publish Haven's list and hours, whole, with the
// revision it started from.

export async function GET(request: Request) {
  return servicesRoute(request, async () => ({
    ok: true,
    body: await servicesSnapshot(),
    siteChanged: false
  }));
}

export async function PUT(request: Request) {
  return servicesRoute(request, (uid, body) => publishServices(body, uid), {
    body: true
  });
}
