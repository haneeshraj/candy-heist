import { z } from 'zod';
import releasesData from './releases.json';

// The catalogue's shape, and the site's own catalogue, in shelf order (the
// home page's tape shelf runs through it as written; the discography page
// sorts it itself). Candy Haven's RELEASES replaces it whole once it
// publishes (getCatalogue.ts), in this same shape.
//
// DUMMY DATA: only 4x4, Truths Collide and Over The Moon are real releases
// (from the Candy Haven discography notes), and they carry only what those
// notes say: no dates, credits or track titles that aren't known ("Title to
// come" holds the place). Every other title, date, credit and track is a
// placeholder, the covers and tape renders are generated artwork, and the
// streaming links are searches. The real catalogue (Candy Haven's discography, by Server Action
// or database) replaces this file with the same shape: the fields follow
// Candy Haven's release model.

const text = z.string().trim().min(1);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

// Candy Haven's release kinds, plus the archive's bootleg.
export const RELEASE_KINDS = [
  'album',
  'ep',
  'single',
  'remix',
  'bootleg',
  'compilation'
] as const;

export const PLATFORMS = [
  'spotify',
  'apple-music',
  'youtube-music',
  'youtube',
  'soundcloud',
  'deezer',
  'tidal'
] as const;

const credit = z.object({
  /** How the credit reads: "Produced by", "Artwork by". */
  role: text,
  names: z.array(text).min(1)
});

// A track of a release. On an album, an EP or a compilation, a track that
// came out with it has a page of its own under the release's (its slug),
// in the release's cover; the grid leaves it out and reaches it through
// the release (Candy Haven's "track of", D30). A track that came out as a
// single first is that single's own record (single): its row goes to the
// single's page, in the single's own cover. A track still to be named has
// neither.
const track = z
  .object({
    title: text,
    /** Minutes and seconds, "4:12". Missing while it isn't known. */
    duration: z
      .string()
      .regex(/^\d+:[0-5]\d$/)
      .optional(),
    /** Its artist, where it isn't the release's (a compilation's tracks). */
    artist: text.optional(),
    featuring: z.array(text).optional(),
    /** Its page's URL segment, under the release's. */
    slug: slug.optional(),
    /** The recording's own single, when it was also released as one. */
    single: slug.optional()
  })
  .refine((t) => !(t.slug && t.single), {
    message: "A track has a page of its own or its single's, not both"
  });

// A platform the release is on: where to stream it once it's out, and
// where to pre-save it before (DistroKid's HyperFollow, say).
const distribution = z.object({
  platform: z.enum(PLATFORMS),
  streamUrl: z.url().optional(),
  presaveUrl: z.url().optional()
});

export const releaseSchema = z
  .object({
    /** Stable key, and the release page's URL segment. */
    slug,
    title: text,
    /** "Candy Heist Remix", "Candy Heist Flip". */
    subtitle: text.optional(),
    kind: z.enum(RELEASE_KINDS),
    /** The billed artist line, as it's shown. */
    artist: text,
    /** The day it's out, YYYY-MM-DD. Missing while it isn't known. */
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    label: text.optional(),
    /** Square artwork. */
    cover: z.object({ src: text, alt: text }),
    /** The cassette render shown on the shelf (see lib/shelf/tapeSprite). */
    tape: text,
    credits: z.array(credit).default([]),
    tracks: z.array(track).min(1),
    distribution: z.array(distribution).default([])
  })
  .refine(
    (r) =>
      !['single', 'remix', 'bootleg'].includes(r.kind) || r.tracks.length === 1,
    { message: 'A single, remix or bootleg holds exactly one track' }
  )
  // Its page is its one track's page already.
  .refine((r) => r.tracks.length > 1 || !r.tracks[0].slug, {
    message: 'Only a track of a release with several has a page of its own'
  })
  .refine(
    (r) => {
      const slugs = r.tracks.flatMap((t) => (t.slug ? [t.slug] : []));
      return new Set(slugs).size === slugs.length;
    },
    { message: "A release's track slugs must be unique" }
  );

export type Release = z.infer<typeof releaseSchema>;
export type ReleaseKind = Release['kind'];
export type Platform = (typeof PLATFORMS)[number];
export type Track = Release['tracks'][number];

/**
 * The site's own catalogue, from releases.json: what the pages show until
 * Candy Haven's RELEASES publishes, and never after. Read the catalogue the
 * pages show through getCatalogue (getCatalogue.ts), not this.
 */
export const fileReleases: Release[] = z
  .array(releaseSchema)
  .min(1)
  .refine((list) => new Set(list.map((r) => r.slug)).size === list.length, {
    message: 'Release slugs must be unique'
  })
  .parse(releasesData);

export function findRelease(
  releases: readonly Release[],
  slug: string | null | undefined
) {
  return releases.find((release) => release.slug === slug);
}

export { releaseHref, shareHref, trackHref, trackShareHref } from './links';
