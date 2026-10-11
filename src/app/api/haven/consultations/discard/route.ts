import { discardUpload } from '@/lib/consult/store';
import { consultRoute } from '@/lib/haven/consultRoutes';

// { pathname }: deletes an upload whose link never opened, rather than
// leave it taking room until the daily sweep finds it.
export function POST(request: Request) {
  return consultRoute(request, (_, body) => discardUpload(body), {
    body: true
  });
}
