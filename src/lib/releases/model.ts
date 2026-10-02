import { z } from 'zod';
import { PLATFORMS } from '@/content/discography/releases';
import { slugify } from '@/lib/text/slug';

// The releases as Candy Haven sends them, in the terms its API speaks.
//
// Haven keeps the whole catalogue in DISCOGRAPHY, on the machine it runs
// on; RELEASES sends the part a visitor sees. So this is what a release
// carries here, how long each part may be, and what Haven gets back from
// every request. The UPC and the ISRCs come too, to recognise a release
// sent from the other copy of Haven and to link an album's track to its
// single; they're never shown.
//
// Pure: the store (store.ts) and the routes use it, and so do the tests.

export const RELEASE_LIMITS = {
  title: 120,
  subtitle: 120,
  artist: 200,
  label: 120,
  role: 60,
  name: 120,
  names: 20,
  tracks: 60,
  credits: 40,
  distribution: 12,
  url: 500,
  /** Releases one "Publish everything" sends. */
  batch: 300,
  /** Releases on the home page shelf. */
  shelf: 8
} as const;

/** Haven's release kinds. The site's catalogue also has the archive's bootleg. */
export const HAVEN_KINDS = [
  'single',
  'ep',
  'album',
  'compilation',
  'remix'
] as const;
export type HavenKind = (typeof HAVEN_KINDS)[number];

/**
 * Not announced yet (draft), announced with its day to come (scheduled,
 * shown with its pre-save links), or out (released).
 */
export const RELEASE_STATUSES = ['draft', 'scheduled', 'released'] as const;
export type ReleaseStatus = (typeof RELEASE_STATUSES)[number];

const OBJECT_ID = /^[a-f0-9]{24}$/i;

/** A release's id on the site: an ObjectId, in hex, made when it's first sent. */
export const isReleaseId = (id: string) => OBJECT_ID.test(id);

/** Lower-cased, so the same release is the same id however it was written. */
const releaseId = z.string().regex(OBJECT_ID).toLowerCase();

const required = (max: number, message: string) =>
  z.string().trim().min(1, message).max(max);
/** Optional text, where Haven's empty string means none. */
const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || undefined)
    .optional();
const url = z.url().max(RELEASE_LIMITS.url);

const trackSchema = z.object({
  /** Empty while it's still to be named. */
  title: z.string().trim().max(RELEASE_LIMITS.title),
  /** Minutes and seconds, "4:12". */
  duration: z
    .string()
    .regex(/^\d+:[0-5]\d$/)
    .optional(),
  /** Its artist, where it isn't the release's (a compilation's tracks). */
  artist: optional(RELEASE_LIMITS.artist),
  featuring: z
    .array(required(RELEASE_LIMITS.name, 'A featured artist needs a name'))
    .max(RELEASE_LIMITS.names)
    .optional(),
  /** The recording's ISRC: links an album's track to its single. Never shown. */
  isrc: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/, 'That ISRC is not twelve characters')
    .optional()
    .or(z.literal('').transform(() => undefined))
});
export type ReleaseTrackInput = z.infer<typeof trackSchema>;

const creditSchema = z.object({
  /** How the credit reads: "Produced by". */
  role: required(RELEASE_LIMITS.role, 'A credit needs its role'),
  names: z
    .array(required(RELEASE_LIMITS.name, 'A credit needs a name'))
    .min(1, 'A credit needs a name')
    .max(RELEASE_LIMITS.names)
});

const distributionSchema = z
  .object({
    platform: z.enum(PLATFORMS),
    streamUrl: url.optional(),
    presaveUrl: url.optional()
  })
  .refine((d) => d.streamUrl || d.presaveUrl, {
    message: 'A platform needs a link to stream or to pre-save'
  });

/** Every field a release has here, each its own key so a change can send just itself. */
const fieldsShape = {
  title: required(RELEASE_LIMITS.title, 'A release needs a title'),
  /** "Candy Heist Remix", "Candy Heist Flip". */
  subtitle: optional(RELEASE_LIMITS.subtitle),
  kind: z.enum(HAVEN_KINDS),
  status: z.enum(RELEASE_STATUSES),
  /** The billed artist line, as it's shown. */
  artist: required(RELEASE_LIMITS.artist, 'A release needs its artist'),
  /** The day it's out, YYYY-MM-DD; null while it isn't known. */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'A date is YYYY-MM-DD')
    .nullable(),
  label: optional(RELEASE_LIMITS.label),
  credits: z.array(creditSchema).max(RELEASE_LIMITS.credits),
  tracks: z.array(trackSchema).max(RELEASE_LIMITS.tracks),
  distribution: z.array(distributionSchema).max(RELEASE_LIMITS.distribution),
  /** The product's barcode: how the other copy of Haven finds it. Never shown. */
  upc: z
    .string()
    .trim()
    .regex(/^(\d{8,14})?$/, 'A UPC is 8 to 14 digits')
};

const fieldsObject = z.object(fieldsShape);
export type ReleaseFields = z.infer<typeof fieldsObject>;

/** What the release pages need of a whole release, whichever copy of Haven sent which part. */
export function releaseProblem(fields: ReleaseFields): string | null {
  if (!fields.tracks.length)
    return 'A release needs at least one track to go on the website.';
  if (
    (fields.kind === 'single' || fields.kind === 'remix') &&
    fields.tracks.length !== 1
  )
    return `A ${fields.kind} holds exactly one track.`;
  return null;
}

/** A whole release: what "Publish everything" and a release's first send carry. */
export const releaseSchema = fieldsObject.superRefine((fields, ctx) => {
  const problem = releaseProblem(fields);
  if (problem) ctx.addIssue({ code: 'custom', message: problem });
});

/** A change: only the fields that changed since the copy of Haven last sent them. */
export const releasePatchSchema = fieldsObject
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, {
    message: 'Nothing changed'
  });
export type ReleasePatch = z.infer<typeof releasePatchSchema>;

/** A release with Haven's own id for it, which comes back with the site's. */
export const releaseEntrySchema = z.object({
  ref: z.string().min(1).max(100),
  fields: releaseSchema
});

/** "Publish everything": every release Haven has, at once. */
export const batchSchema = z.object({
  releases: z
    .array(releaseEntrySchema)
    .min(1, 'There is nothing to publish')
    .max(RELEASE_LIMITS.batch)
});

/** Hidden by hand (false), or not (true, or null): then its status and date decide. */
const shownSchema = z.boolean().nullable();
export const visibilitySchema = z.object({ shown: shownSchema });

const eachOnce = (keys: string[]) => new Set(keys).size === keys.length;
const onceEach = (changes: Array<{ id: string }>) =>
  eachOnce(changes.map((change) => change.id));

/** The shelf's releases, in order: up to eight, each once. */
const shelfIds = z
  .array(releaseId)
  .max(RELEASE_LIMITS.shelf, `The shelf holds ${RELEASE_LIMITS.shelf}`)
  .refine(eachOnce, { message: 'A release is on the shelf once' });

/** The home page shelf: up to eight releases, in order. */
export const shelfSchema = z.object({ ids: shelfIds });

/**
 * Several changes in one request, made together or not at all: releases
 * this copy of Haven sends for the first time, changed fields, hidden or
 * not, and the whole shelf. A release can be changed and hidden in the
 * same request, but is named once in each list. One only just sent can't
 * go on the shelf until the next request: Haven doesn't have its id yet.
 */
export const changesSchema = z
  .object({
    add: z
      .array(releaseEntrySchema)
      .max(RELEASE_LIMITS.batch)
      .refine((entries) => eachOnce(entries.map((entry) => entry.ref)), {
        message: 'A release is sent once in a request'
      })
      .default([]),
    update: z
      .array(z.object({ id: releaseId, fields: releasePatchSchema }))
      .max(RELEASE_LIMITS.batch)
      .refine(onceEach, { message: 'A release is changed once in a request' })
      .default([]),
    visibility: z
      .array(z.object({ id: releaseId, shown: shownSchema }))
      .max(RELEASE_LIMITS.batch)
      .refine(onceEach, {
        message: 'A release is hidden or shown once in a request'
      })
      .default([]),
    /** The whole shelf, in order; left out, the shelf stays as it is. */
    shelf: shelfIds.optional()
  })
  .refine(
    (changes) =>
      changes.add.length > 0 ||
      changes.update.length > 0 ||
      changes.visibility.length > 0 ||
      changes.shelf !== undefined,
    { message: 'There is nothing to change' }
  );
export type ReleaseChanges = z.infer<typeof changesSchema>;

// ---------------------------------------------------------------- matching

const SPOTIFY_ALBUM =
  /^https:\/\/open\.spotify\.com\/(?:intl-[a-z-]+\/)?album\/([A-Za-z0-9]+)/;

/** The Spotify album a release links to, if it does: one way to recognise it. */
export function spotifyAlbumId(
  distribution: ReleaseFields['distribution']
): string {
  for (const d of distribution) {
    if (d.platform !== 'spotify') continue;
    for (const link of [d.streamUrl, d.presaveUrl]) {
      const id = link && SPOTIFY_ALBUM.exec(link)?.[1];
      if (id) return id;
    }
  }
  return '';
}

/** The last way to recognise a release: its title, as a slug, and its kind. */
export const titleKey = (title: string, kind: HavenKind) =>
  `${slugify(title) || title.trim().toLowerCase()}|${kind}`;

/** Today as a release date is written, YYYY-MM-DD, in UTC. */
export const today = () => new Date().toISOString().slice(0, 10);

/**
 * Whether visitors see it. Hidden by hand in RELEASES, never. Otherwise
 * once it's out, by its status or by its date having come (so a release
 * whose status nobody moved on the day still shows), and before then only
 * once it's announced: a scheduled release shows with its pre-save links,
 * a draft waits for its day. Scheduled for no day isn't announced (Haven
 * won't schedule one without a date), so it waits too.
 */
export function isVisible(
  release: {
    shown: boolean | null;
    status: ReleaseStatus;
    date: string | null;
  },
  on: string = today()
): boolean {
  if (release.shown === false) return false;
  const out =
    release.status === 'released' ||
    (release.date !== null && release.date <= on);
  return out || (release.status === 'scheduled' && release.date !== null);
}

// ---------------------------------------------------------------- snapshot

export interface PublishedReleaseForHaven {
  id: string;
  /** Its page's address, /discography/<slug>. Kept for good once given. */
  slug: string;
  title: string;
  kind: HavenKind;
  status: ReleaseStatus;
  date: string | null;
  /** The three ways a copy of Haven recognises a release it hasn't linked yet. */
  upc: string;
  spotifyId: string;
  titleKey: string;
  /** False when hidden by hand in RELEASES; true or null leave it to its status and date. */
  shown: boolean | null;
  /** Whether visitors see it now. */
  visible: boolean;
  /** Its cover's public address; null while it shows the placeholder. */
  cover: string | null;
  updatedAt: string;
  /** Who sent it last: a Firebase account id from Haven. */
  updatedBy: string;
}

/** What's on the site, as every request hands it back. */
export interface ReleasesSnapshot {
  /** Whether Haven's releases have replaced the site's own. */
  live: boolean;
  releases: PublishedReleaseForHaven[];
  /** The home page shelf, in order: release ids. */
  shelf: string[];
}

/** "Publish everything": the snapshot, and the site's id for each of Haven's. */
export interface BatchResult extends ReleasesSnapshot {
  ids: Record<string, string>;
}
