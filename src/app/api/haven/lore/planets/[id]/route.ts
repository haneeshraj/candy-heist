import { loreRoute, type IdContext } from '@/lib/haven/loreRoutes';
import { deletePlanet, savePlanet } from '@/lib/lore/store';

// One planet: PUT saves it (refused, with the newer version, if someone
// else saved since), DELETE removes it, unless a chapter uses it.

export async function PUT(request: Request, { params }: IdContext) {
  const { id } = await params;
  return loreRoute(request, (uid, body) => savePlanet(id, body, uid), {
    body: true
  });
}

export async function DELETE(request: Request, { params }: IdContext) {
  const { id } = await params;
  return loreRoute(request, () => deletePlanet(id));
}
