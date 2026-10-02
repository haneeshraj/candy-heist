import { releasesRoute, type IdContext } from '@/lib/haven/releaseRoutes';
import { removeRelease, updateRelease } from '@/lib/releases/store';

// One release on the site. PATCH: the fields that changed since this copy
// of Haven last sent them. DELETE: it left DISCOGRAPHY, so it leaves here.

export async function PATCH(request: Request, { params }: IdContext) {
  const { id } = await params;
  return releasesRoute(request, (uid, body) => updateRelease(id, body, uid), {
    body: true
  });
}

export async function DELETE(request: Request, { params }: IdContext) {
  const { id } = await params;
  return releasesRoute(request, () => removeRelease(id));
}
