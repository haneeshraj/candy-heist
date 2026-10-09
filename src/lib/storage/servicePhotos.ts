import 'server-only';
import sharp from 'sharp';
import { coversConfigured, storedUrl, storeWebp } from './covers';

// The services' photos. Candy picks one image per service in Candy Haven;
// the site cuts both shapes the pages use from it: the card (portrait,
// 700×1000, in the list) and the banner (wide, 1600×609, over the details
// and the summary), each as a WebP at quality 82, cut around whatever in
// the picture draws the eye rather than its middle. They're kept beside
// the release covers, in the same bucket, in a folder of their own, under
// names made from their bytes.

const FOLDER = 'services';

export const SERVICE_PHOTO_SIZES = {
  card: { width: 700, height: 1000 },
  wide: { width: 1600, height: 609 }
} as const;

/** The smallest a sent photo may be, as it stands up: below this the banner would be blown up. */
export const SERVICE_PHOTO_MIN = { width: 1200, height: 800 } as const;

/** The bucket refuses anything larger. */
const MAX_BYTES = 1024 * 1024;
const QUALITY = 82;
/** Far beyond any photo, and short of what would run a server out of memory to decode. */
const MAX_INPUT_PIXELS = 60_000_000;
const READABLE = new Set(['png', 'jpeg', 'webp']);

/** A sent image the website can't make a service's photos of, in words Haven can show. */
export class InvalidPhotoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPhotoError';
  }
}

export interface ServicePhotos {
  card: Buffer;
  wide: Buffer;
}

/**
 * The two photos, turned the way the camera said. Throws InvalidPhotoError
 * for a file that isn't a PNG, JPEG or WebP, or is too small.
 */
export async function encodeServicePhotos(
  input: Buffer
): Promise<ServicePhotos> {
  const image = () => sharp(input, { limitInputPixels: MAX_INPUT_PIXELS });

  const meta = await image()
    .metadata()
    .catch(() => {
      throw new InvalidPhotoError(
        'That file isn’t an image the website can read.'
      );
    });
  if (!READABLE.has(meta.format))
    throw new InvalidPhotoError('A photo is sent as a PNG, a JPEG or a WebP.');
  // Orientations 5 to 8 stand the picture on its side.
  const turned = (meta.orientation ?? 1) >= 5;
  const width = turned ? meta.height : meta.width;
  const height = turned ? meta.width : meta.height;
  if (width < SERVICE_PHOTO_MIN.width || height < SERVICE_PHOTO_MIN.height)
    throw new InvalidPhotoError(
      `A service’s photo needs to be at least ${SERVICE_PHOTO_MIN.width} pixels wide and ${SERVICE_PHOTO_MIN.height} tall; that one is ${width}×${height}.`
    );

  const cut = async (size: { width: number; height: number }) => {
    const data = await image()
      .rotate()
      .resize(size.width, size.height, {
        fit: 'cover',
        position: sharp.strategy.attention
      })
      .webp({ quality: QUALITY, effort: 6, smartSubsample: true })
      .toBuffer()
      .catch(() => {
        throw new InvalidPhotoError(
          'That image is damaged: it couldn’t be read.'
        );
      });
    if (data.length > MAX_BYTES)
      throw new InvalidPhotoError(
        'That photo comes out over 1 MB even as a WebP: try a simpler image.'
      );
    return data;
  };
  const [card, wide] = await Promise.all([
    cut(SERVICE_PHOTO_SIZES.card),
    cut(SERVICE_PHOTO_SIZES.wide)
  ]);
  return { card, wide };
}

export interface StoredServicePhotos {
  /** The public addresses the pages load. */
  card: string;
  wide: string;
}

/** Makes both photos from one image and puts them in the bucket. */
export async function storeServicePhotos(
  input: Buffer
): Promise<StoredServicePhotos> {
  const { card, wide } = await encodeServicePhotos(input);
  const [storedCard, storedWide] = await Promise.all([
    storeWebp(FOLDER, 'card-', card),
    storeWebp(FOLDER, 'wide-', wide)
  ]);
  return { card: storedCard.url, wide: storedWide.url };
}

const OWN_FILE = /^\/img\/[a-z0-9_-]+(?:\/[a-z0-9_.-]+)+$/i;
const STORED_NAME = /^(?:card|wide)-[a-f0-9]{16}\.webp$/;

/**
 * Whether a service may show `address`: one of the site's own photos
 * (under /img/), or one stored here for a service. Anything else, a
 * stranger's site or a guess, is refused when the services are published.
 */
export function isServicePhotoAddress(address: string): boolean {
  if (OWN_FILE.test(address)) return !address.includes('..');
  if (!coversConfigured()) return false;
  const folder = storedUrl(`${FOLDER}/`);
  return (
    address.startsWith(folder) && STORED_NAME.test(address.slice(folder.length))
  );
}
