import { listConsultations, sweepConsultations } from '@/lib/consult/store';
import { admitHaven, havenFailure, havenJson } from '@/lib/haven/guard';

// Haven's check-in found a closed link whose track is still in the store:
// delete what should be gone now, rather than at the daily sweep, and
// answer with the list as it stands after, as GET does.
export async function POST(request: Request) {
  const admitted = await admitHaven(request);
  if ('response' in admitted) return admitted.response;
  try {
    const now = new Date();
    await sweepConsultations(now);
    return havenJson(await listConsultations(now));
  } catch (error) {
    return havenFailure(error);
  }
}
