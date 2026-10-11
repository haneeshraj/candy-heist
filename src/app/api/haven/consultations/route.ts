import { listConsultations, openConsultation } from '@/lib/consult/store';
import { admitHaven, havenFailure, havenJson } from '@/lib/haven/guard';
import { consultRoute } from '@/lib/haven/consultRoutes';

// Candy Haven's CONSULTATION. GET: every track shared for feedback, the
// open ones with their links, the closed ones as the record that they
// were. POST: opens a link for a track Haven has just uploaded to storage.
export async function GET(request: Request) {
  const admitted = await admitHaven(request);
  if ('response' in admitted) return admitted.response;
  try {
    return havenJson(await listConsultations());
  } catch (error) {
    return havenFailure(error);
  }
}

export function POST(request: Request) {
  return consultRoute(request, (uid, body) => openConsultation(body, uid), {
    body: true
  });
}
