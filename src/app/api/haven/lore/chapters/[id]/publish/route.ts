import { loreRoute, type IdContext } from '@/lib/haven/loreRoutes';
import { publishChapter, unpublishChapter } from '@/lib/lore/store';

// Putting one chapter on the site (POST, with the revision being
// published) or taking it off (DELETE). The draft stays either way.

export async function POST(request: Request, { params }: IdContext) {
  const { id } = await params;
  return loreRoute(request, (uid, body) => publishChapter(id, body, uid), {
    body: true
  });
}

export async function DELETE(request: Request, { params }: IdContext) {
  const { id } = await params;
  return loreRoute(request, () => unpublishChapter(id));
}
