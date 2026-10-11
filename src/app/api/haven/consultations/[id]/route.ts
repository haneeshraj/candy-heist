import { changeConsultation, removeConsultation } from '@/lib/consult/store';
import { consultRoute, type IdContext } from '@/lib/haven/consultRoutes';

// One shared track. PATCH: { expiresAt } moves when its link closes.
// DELETE: forgets it altogether, the record of it and its track included.

export async function PATCH(request: Request, { params }: IdContext) {
  const { id } = await params;
  return consultRoute(request, (_, body) => changeConsultation(id, body), {
    body: true
  });
}

export async function DELETE(request: Request, { params }: IdContext) {
  const { id } = await params;
  return consultRoute(request, () => removeConsultation(id));
}
