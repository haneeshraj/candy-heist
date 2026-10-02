import { loreRoute } from '@/lib/haven/loreRoutes';
import { createChapter } from '@/lib/lore/store';

// A new chapter, as a draft, at the end of the order.
export function POST(request: Request) {
  return loreRoute(request, (uid, body) => createChapter(body, uid), {
    body: true
  });
}
