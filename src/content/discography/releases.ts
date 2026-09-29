import { z } from 'zod';
import releasesData from './releases.json';

// The catalogue, in shelf order. DUMMY DATA: only 4x4, Truths Collide and
// Over The Moon are real releases (from the Candy Haven discography notes);
// every other title is a placeholder so the shelf has enough tapes to run,
// until the real catalogue (Server Action / database) replaces this file with
// the same shape. The covers and tape renders are generated artwork.

const text = z.string().trim().min(1);

export const releaseSchema = z.object({
  /** Stable key, and the release page's URL segment. */
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: text,
  artist: text,
  /** Square artwork. */
  cover: z.object({ src: text, alt: text }),
  /** The cassette render shown on the shelf (see lib/shelf/tapeSprite). */
  tape: text
});

export type Release = z.infer<typeof releaseSchema>;

export const releases: Release[] = z
  .array(releaseSchema)
  .min(1)
  .refine((list) => new Set(list.map((r) => r.slug)).size === list.length, {
    message: 'Release slugs must be unique'
  })
  .parse(releasesData);

export function findRelease(slug: string | null | undefined) {
  return releases.find((release) => release.slug === slug);
}

export const releaseHref = (slug: string) => `/discography/${slug}`;
