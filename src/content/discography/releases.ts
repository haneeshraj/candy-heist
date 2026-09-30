import { z } from 'zod';
import releasesData from './releases.json';

// The catalogue, in shelf order (the home page's tape shelf runs through it
// as written; the discography page sorts it itself).
//
// DUMMY DATA: only 4x4, Truths Collide and Over The Moon are real releases
// (from the Candy Haven discography notes), and they carry only what those
// notes say: no dates, credits or track titles that aren't known ("Title to
// come" holds the place). Every other title, date, credit and track is a
// placeholder, the covers and tape renders are generated artwork (the two
// canvas loops are drifts over those covers), and the streaming links are
// searches. The real catalogue (Candy Haven's discography, by Server Action
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

const track = z.object({
  title: text,
  /** Minutes and seconds, "4:12". Missing while it isn't known. */
  duration: z
    .string()
    .regex(/^\d+:[0-5]\d$/)
    .optional(),
  /** Its artist, where it isn't the release's (a compilation's tracks). */
  artist: text.optional(),
  featuring: z.array(text).optional(),
  /** The recording's own single, when it was also released as one. */
  single: slug.optional()
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
    /** The 9:16 loop behind the track (Spotify's canvas), when there is one. */
    canvas: z.object({ src: text, poster: text.optional() }).optional(),
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
  );

export type Release = z.infer<typeof releaseSchema>;
export type ReleaseKind = Release['kind'];
export type Platform = (typeof PLATFORMS)[number];
export type Track = Release['tracks'][number];

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

export { releaseHref, shareHref } from './links';
