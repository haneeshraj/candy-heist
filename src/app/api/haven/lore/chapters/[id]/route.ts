import { loreRoute, type IdContext } from '@/lib/haven/loreRoutes';
import { publishChapter, unpublishChapter } from '@/lib/lore/store';

// One chapter on the site: PUT publishes it as Haven sends it (refused,
// with the newer version, if someone else published it since the draft
// started from it); DELETE takes it off. Haven keeps the draft either way.

export async function PUT(request: Request, { params }: IdContext) {
  const { id } = await params;
  return loreRoute(request, (uid, body) => publishChapter(id, body, uid), {
    body: true
  });
}

export async function DELETE(request: Request, { params }: IdContext) {
  const { id } = await params;
  return loreRoute(request, () => unpublishChapter(id));
}
