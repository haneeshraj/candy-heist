import { loreRoute, type IdContext } from '@/lib/haven/loreRoutes';
import { deleteChapter, saveChapter } from '@/lib/lore/store';

// One chapter's draft: PUT saves it (refused, with the newer version, if
// someone else saved since), DELETE removes it everywhere, site included.

export async function PUT(request: Request, { params }: IdContext) {
  const { id } = await params;
  return loreRoute(request, (uid, body) => saveChapter(id, body, uid), {
    body: true
  });
}

export async function DELETE(request: Request, { params }: IdContext) {
  const { id } = await params;
  return loreRoute(request, () => deleteChapter(id));
}
