import { havenJson } from '@/lib/haven/guard';
import {
  releasesRoute,
  type BytesBody,
  type IdContext
} from '@/lib/haven/releaseRoutes';
import { clearCover, setCover } from '@/lib/releases/store';
import { coversConfigured } from '@/lib/storage/covers';

// A release's cover. PUT: the image itself as the body, a PNG, JPEG or
// WebP Haven has already brought down to about 750×750; the site makes
// its WebP and stores it. DELETE: back to the placeholder.

/**
 * Haven's are about 1 MB. Well past that is refused unread, and a host
 * may refuse sooner (Vercel takes about 4.5 MB).
 */
const COVER_BODY: BytesBody = {
  types: ['image/png', 'image/jpeg', 'image/webp'],
  limit: 8 * 1024 * 1024
};

const noStorage = () =>
  coversConfigured()
    ? null
    : havenJson(
        {
          error: 'storage_unconfigured',
          message: 'The website has no cover storage set up yet.'
        },
        503
      );

export async function PUT(request: Request, { params }: IdContext) {
  const { id } = await params;
  return releasesRoute(request, (uid, image) => setCover(id, image, uid), {
    bytes: COVER_BODY,
    unavailable: noStorage
  });
}

export async function DELETE(request: Request, { params }: IdContext) {
  const { id } = await params;
  return releasesRoute(request, (uid) => clearCover(id, uid));
}
