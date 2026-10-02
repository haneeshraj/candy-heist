import { loreRoute } from '@/lib/haven/loreRoutes';
import { createPlanet } from '@/lib/lore/store';

// A new planet in the library.
export function POST(request: Request) {
  return loreRoute(request, (uid, body) => createPlanet(body, uid), {
    body: true
  });
}
