import { prepareUpload } from '@/lib/consult/store';
import { consultRoute } from '@/lib/haven/consultRoutes';

// The pass for one upload: { extension, contentType, bytes } in, a name in
// the Blob store and a token for exactly that file out, good for an hour.
// Refused with no_store before the store exists, and no_room when the
// track wouldn't fit in the free allowance.
export function POST(request: Request) {
  return consultRoute(request, (_, body) => prepareUpload(body), {
    body: true
  });
}
