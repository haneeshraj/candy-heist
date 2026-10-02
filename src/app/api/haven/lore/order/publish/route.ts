import { loreRoute } from '@/lib/haven/loreRoutes';
import { publishOrder } from '@/lib/lore/store';

// Puts the published chapters in the drafts' order.
export function POST(request: Request) {
  return loreRoute(request, () => publishOrder());
}
