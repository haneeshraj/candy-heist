import { z } from 'zod';
import {
  isPresetId,
  planetSpecSchema,
  type PlanetSpec
} from '@/lib/planets/engine';

// The lore as Candy Haven publishes it, in the terms its API speaks.
//
// Haven keeps the drafts and the planet library on the machine they're
// written on. What reaches the site is a chapter as it stood when it was
// published, with a copy of its planet. So this is what a published
// chapter carries, how long each part may be, and the lore Haven gets
// back from every request.
//
// Pure: the store (store.ts) and the routes use it, and so do the tests.

export const LORE_LIMITS = {
  title: 80,
  line: 200,
  body: 100_000,
  slug: 60,
  planetName: 60
} as const;

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const OBJECT_ID = /^[a-f0-9]{24}$/i;

/** A chapter's id, made by Haven with the chapter: an ObjectId, in hex. */
export const isChapterId = (id: string) => OBJECT_ID.test(id);

/** A preset (`preset:omun`) or a planet from Haven's library. */
export const isPlanetId = (id: string) => isPresetId(id) || OBJECT_ID.test(id);

/** What Haven sends to publish a chapter: all of it, as it stands. */
export const publishInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'A chapter needs an address')
    .max(LORE_LIMITS.slug)
    .regex(SLUG_PATTERN, 'An address is lowercase words joined by dashes'),
  title: z
    .string()
    .trim()
    .min(1, 'A chapter needs a title')
    .max(LORE_LIMITS.title),
  line: z
    .string()
    .trim()
    .min(1, 'Give the chapter its one line before publishing it.')
    .max(LORE_LIMITS.line),
  body: z.string().max(LORE_LIMITS.body),
  /** Its planet, copied: changing it in Haven changes nothing here until it's published again. */
  planet: z.object({
    id: z.string().max(60).refine(isPlanetId, 'That planet has no id'),
    name: z
      .string()
      .trim()
      .min(1, 'A planet needs a name')
      .max(LORE_LIMITS.planetName),
    spec: planetSpecSchema
  }),
  /** The published revision Haven's draft started from: 0 when it's never been published. */
  baseRevision: z.number().int().min(0),
  /** Publish anyway, over a newer version someone else published. */
  force: z.boolean().default(false)
});
export type PublishInput = z.infer<typeof publishInputSchema>;

/** The published chapters' order, as the full list of their ids. */
export const orderSchema = z.object({
  ids: z.array(z.string().regex(OBJECT_ID)).max(500)
});

// ---------------------------------------------------------------- snapshot

export interface PublishedChapterForHaven {
  id: string;
  slug: string;
  title: string;
  line: string;
  body: string;
  planetId: string;
  planetName: string;
  planet: PlanetSpec;
  order: number;
  /** Goes up by one on every publish, so two writers notice each other. */
  revision: number;
  publishedAt: string;
  /** Who published it last: a Firebase account id from Haven. */
  publishedBy: string;
}

/** What's published, as every request hands it back. */
export interface LoreSnapshot {
  /** Whether Haven's lore has replaced the site's files. */
  live: boolean;
  /** In their order on the site. */
  chapters: PublishedChapterForHaven[];
}
