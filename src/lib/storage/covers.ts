import 'server-only';
import { createHash } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';

// Release covers, kept in a public Supabase Storage bucket the pages load
// them from.
//
// Candy Haven sends each cover already downsized, losslessly (a PNG, or a
// JPEG or WebP as it was); the one lossy step happens here, so it happens
// once: a 750×750 WebP at quality 82, with nothing about the file kept
// but its pixels. Each is stored under a name made from its bytes, so a
// new cover is a new address and nothing serves an old one from a cache.
//
// Where it is, read from the environment like the database:
//
//   NEXT_PUBLIC_SUPABASE_URL   the Supabase project
//   SUPABASE_SECRET_KEY        its secret key (sb_secret_...), server only
//   SUPABASE_COVERS_BUCKET     covers-dev in development, covers when live

/**
 * The bucket covers go in while SUPABASE_COVERS_BUCKET isn't set: the
 * development one, so a server set up without it never writes to the live
 * site's covers by accident.
 */
export const DEFAULT_COVERS_BUCKET = 'covers-dev';

/** A cover's sides, in pixels. */
export const COVER_SIZE = 750;
/** The smallest side a sent image may have: below this it would be blown up. */
export const COVER_MIN_SIDE = 300;
/** The bucket refuses anything larger. */
export const COVER_MAX_BYTES = 1024 * 1024;
/** The floor, not a starting point: lower and the artwork shows it. */
const COVER_QUALITY = 82;
/**
 * Pixels an image may declare before it's refused unread: far beyond any
 * artwork, and short of what would run a server out of memory to decode.
 */
const MAX_INPUT_PIXELS = 50_000_000;
const READABLE = new Set(['png', 'jpeg', 'webp']);

export interface CoversConfig {
  url: string;
  secretKey: string;
  bucket: string;
}

/** Cover storage's settings, or null while the project or its key is missing. */
export function readCoversConfig(
  env: Record<string, string | undefined>
): CoversConfig | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = env.SUPABASE_SECRET_KEY?.trim();
  const bucket = env.SUPABASE_COVERS_BUCKET?.trim() || DEFAULT_COVERS_BUCKET;
  return url && secretKey ? { url, secretKey, bucket } : null;
}

export const coversConfigured = () => readCoversConfig(process.env) !== null;

/** A sent image the website can't make a cover of, in words Haven can show. */
export class InvalidCoverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCoverError';
  }
}

export interface EncodedCover {
  data: Buffer;
  width: number;
  height: number;
  bytes: number;
}

/**
 * The cover as the pages show it: turned the way its camera said, cut to
 * a square from the middle, 750×750, WebP. Throws InvalidCoverError for
 * a file that isn't a PNG, JPEG or WebP, or is too small to make one.
 */
export async function encodeCover(input: Buffer): Promise<EncodedCover> {
  const image = () => sharp(input, { limitInputPixels: MAX_INPUT_PIXELS });

  const { format, width, height } = await image()
    .metadata()
    .catch(() => {
      throw new InvalidCoverError(
        'That file isn’t an image the website can read.'
      );
    });
  if (!READABLE.has(format))
    throw new InvalidCoverError('A cover is sent as a PNG, a JPEG or a WebP.');
  // Turning it doesn't change its shorter side, so it's checked as it comes.
  if (Math.min(width, height) < COVER_MIN_SIDE)
    throw new InvalidCoverError(
      `A cover needs to be at least ${COVER_MIN_SIDE}×${COVER_MIN_SIDE} pixels; that one is ${width}×${height}.`
    );

  const { data, info } = await image()
    .rotate()
    .resize(COVER_SIZE, COVER_SIZE, { fit: 'cover', position: 'centre' })
    .webp({ quality: COVER_QUALITY, effort: 6, smartSubsample: true })
    .toBuffer({ resolveWithObject: true })
    .catch(() => {
      throw new InvalidCoverError(
        'That image is damaged: it couldn’t be read.'
      );
    });
  if (data.length > COVER_MAX_BYTES)
    throw new InvalidCoverError(
      'That cover comes out over 1 MB even as a WebP: try a simpler image.'
    );
  return { data, width: info.width, height: info.height, bytes: data.length };
}

let client: {
  url: string;
  secretKey: string;
  supabase: SupabaseClient;
} | null = null;

/** The bucket, through one client made when first needed and kept. */
function bucket() {
  const config = readCoversConfig(process.env);
  if (!config) throw new Error('Cover storage is not configured.');
  if (client?.url !== config.url || client.secretKey !== config.secretKey)
    client = {
      url: config.url,
      secretKey: config.secretKey,
      // The server signs in with the secret key on every request: there's
      // no session to keep or refresh.
      supabase: createClient(config.url, config.secretKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      })
    };
  return client.supabase.storage.from(config.bucket);
}

export interface UploadedCover {
  /** Where it is in the bucket: <release id>/<hash>.webp. */
  path: string;
  /** Its public address, which the pages load. */
  url: string;
}

/**
 * Puts a cover in the bucket, under the release and a name made from its
 * bytes. The same cover sent twice lands on itself; a new one, beside the
 * old, which the caller removes once nothing points to it.
 */
export async function uploadCover(
  releaseId: string,
  data: Buffer
): Promise<UploadedCover> {
  return put(releaseId, '', data);
}

/**
 * Puts a release's tape (lib/shelf/tapeFromCover.ts) beside its cover, as
 * tape-<hash>.webp, kept and replaced the same way.
 */
export async function uploadTape(
  releaseId: string,
  data: Buffer
): Promise<UploadedCover> {
  return put(releaseId, 'tape-', data);
}

async function put(
  releaseId: string,
  prefix: string,
  data: Buffer
): Promise<UploadedCover> {
  const hash = createHash('sha256').update(data).digest('hex');
  const path = `${releaseId}/${prefix}${hash.slice(0, 16)}.webp`;
  const covers = bucket();
  const { error } = await covers.upload(path, data, {
    upsert: true,
    // Its name changes with its bytes, so it can be kept for good.
    cacheControl: '31536000',
    contentType: 'image/webp'
  });
  if (error) throw error;
  return { path, url: covers.getPublicUrl(path).data.publicUrl };
}

/**
 * Takes a cover out of the bucket. Best effort: a cover left behind costs
 * a little space, while failing the request over it would leave the site
 * and Haven out of step.
 */
export async function removeCover(path: string): Promise<void> {
  try {
    const { error } = await bucket().remove([path]);
    if (error) throw error;
  } catch (error) {
    console.error(`Cover "${path}" could not be removed from storage.`, error);
  }
}
