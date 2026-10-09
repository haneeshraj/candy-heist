import type { BytesBody } from '@/lib/haven/bytes';
import { havenJson } from '@/lib/haven/guard';
import { servicesRoute } from '@/lib/haven/servicesRoutes';
import { coversConfigured } from '@/lib/storage/covers';
import {
  InvalidPhotoError,
  storeServicePhotos
} from '@/lib/storage/servicePhotos';

// A service's photo. PUT: the image itself as the body, a PNG, JPEG or
// WebP as picked in Candy Haven (one over 4 MB is turned upright and
// brought down to 2400 pixels on its long side there first); the site
// cuts the card and the banner from it, stores both, and answers with
// their addresses for Haven to publish with the service.

/** Haven's are well under this; a host may refuse sooner (Vercel takes about 4.5 MB). */
const PHOTO_BODY: BytesBody = {
  types: ['image/png', 'image/jpeg', 'image/webp'],
  limit: 8 * 1024 * 1024
};

const noStorage = () =>
  coversConfigured()
    ? null
    : havenJson(
        {
          error: 'storage_unconfigured',
          message: 'The website has no photo storage set up yet.'
        },
        503
      );

export async function PUT(request: Request) {
  return servicesRoute(
    request,
    async (_uid, image) => {
      try {
        return {
          ok: true,
          body: await storeServicePhotos(image as Buffer),
          siteChanged: false
        };
      } catch (error) {
        if (!(error instanceof InvalidPhotoError)) throw error;
        return {
          ok: false,
          status: 400,
          body: { error: 'invalid', message: error.message }
        };
      }
    },
    { bytes: PHOTO_BODY, unavailable: noStorage }
  );
}
