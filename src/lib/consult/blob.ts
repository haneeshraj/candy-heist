import 'server-only';
import { BlobNotFoundError, del, head, list } from '@vercel/blob';
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';

// Where a consultation's track lives: this site's Vercel Blob store, a
// public one, so the page plays it straight from Vercel's network. Haven
// never holds a key to it. It asks the site for a pass that uploads one
// named file, of one type, within the hour, and the site does every
// deletion itself. The pass names a size as well, but Vercel doesn't hold
// a file sent in pieces to it, so the size the site goes by is trackSize's.
//
// The store's read-write token is BLOB_READ_WRITE_TOKEN, which Vercel adds
// when the store is connected to the project; it's what signs the passes.
// Deleting and listing use it too, or Vercel's own credentials on Vercel.

/** How long a pass to upload a track lasts. */
export const PASS_MS = 60 * 60 * 1000;

/** How long a producer's browser may keep a track: a second listen in a day comes from it. */
const CACHE_SECONDS = 24 * 60 * 60;

/** Whether this copy of the site has a Blob store to keep tracks in. */
export const blobConfigured = (env: NodeJS.ProcessEnv = process.env) =>
  Boolean(env.BLOB_READ_WRITE_TOKEN);

/**
 * A pass that uploads exactly `pathname`, of `contentType`. It says at most
 * `bytes` too, but a file sent in pieces isn't held to that.
 */
export async function issueUploadToken(
  pathname: string,
  contentType: string,
  bytes: number,
  now: Date
): Promise<{ token: string; validUntil: number }> {
  const validUntil = now.getTime() + PASS_MS;
  const token = await generateClientTokenFromReadWriteToken({
    pathname,
    allowedContentTypes: [contentType],
    maximumSizeInBytes: bytes,
    validUntil,
    addRandomSuffix: false,
    allowOverwrite: false,
    cacheControlMaxAge: CACHE_SECONDS
  });
  return { token, validUntil };
}

/**
 * How big the track at `url` really is, or null if the store has none
 * there. A pass's size isn't held to when a file is sent in pieces, as
 * Haven sends them, so this is the size to trust.
 */
export async function trackSize(url: string): Promise<number | null> {
  try {
    return (await head(url)).size;
  } catch (error) {
    if (error instanceof BlobNotFoundError) return null;
    throw error;
  }
}

/** Deletes a track by its address or name. One already gone counts as deleted. */
export async function deleteTrack(urlOrPathname: string): Promise<void> {
  try {
    await del(urlOrPathname);
  } catch (error) {
    if (!(error instanceof BlobNotFoundError)) throw error;
  }
}

/** Every track in `folder`, with when it was uploaded. */
export async function listTracks(
  folder: string
): Promise<{ url: string; pathname: string; uploadedAt: Date }[]> {
  const tracks: { url: string; pathname: string; uploadedAt: Date }[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: folder, cursor, limit: 1000 });
    for (const { url, pathname, uploadedAt } of page.blobs)
      tracks.push({ url, pathname, uploadedAt });
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return tracks;
}
