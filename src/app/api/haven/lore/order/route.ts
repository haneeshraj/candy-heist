import { loreRoute } from '@/lib/haven/loreRoutes';
import { publishOrder } from '@/lib/lore/store';

// The published chapters' order, as the full list of their ids.
export function PUT(request: Request) {
  return loreRoute(request, (_uid, body) => publishOrder(body), {
    body: true
  });
}
