import { endConsultation } from '@/lib/consult/store';
import { consultRoute, type IdContext } from '@/lib/haven/consultRoutes';

// Closes a shared track's link now: its page stops answering and its
// feedback is deleted, as when its time runs out. The record stays.
export async function POST(request: Request, { params }: IdContext) {
  const { id } = await params;
  return consultRoute(request, () => endConsultation(id));
}
