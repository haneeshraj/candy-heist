import { loreRoute } from '@/lib/haven/loreRoutes';
import { reorderChapters } from '@/lib/lore/store';

// The drafts' order, as the full list of their ids. The site keeps its
// order until it's published (./publish).
export function PUT(request: Request) {
  return loreRoute(request, (_uid, body) => reorderChapters(body), {
    body: true
  });
}
