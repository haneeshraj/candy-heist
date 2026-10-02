import { z } from 'zod';
import {
  isPresetId,
  planetSpecSchema,
  type PlanetSpec
} from '@/lib/planets/engine';

// The lore as Candy Haven writes it, in the terms its API speaks: what a
// draft chapter and a planet carry, how long each part may be, and the
// snapshot of the whole lore Haven gets back from every request.
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

/** A chapter's address from its title: "The Great Disconnection" → the-great-disconnection. */
export function slugify(title: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, LORE_LIMITS.slug)
    .replace(/-+$/g, '');
  return slug || 'chapter';
}

const OBJECT_ID = /^[a-f0-9]{24}$/i;

/** A preset (`preset:omun`) or a saved planet's id. */
export const isPlanetId = (id: string) => isPresetId(id) || OBJECT_ID.test(id);

const planetId = z
  .string()
  .max(60)
  .refine(isPlanetId, 'Pick a planet from the library');

/** What Haven sends to create or save a chapter. Drafts may be unfinished. */
export const chapterInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'A chapter needs a title')
    .max(LORE_LIMITS.title),
  line: z.string().trim().max(LORE_LIMITS.line).default(''),
  /** Its address. Left out, it's made from the title. Fixed once published. */
  slug: z
    .string()
    .trim()
    .max(LORE_LIMITS.slug)
    .regex(SLUG_PATTERN, 'An address is lowercase words joined by dashes')
    .optional(),
  planetId: planetId.default('preset:network'),
  body: z.string().max(LORE_LIMITS.body).default('')
});
export type ChapterInput = z.infer<typeof chapterInputSchema>;

export const saveChapterSchema = chapterInputSchema.extend({
  /** The revision the writer started from: a different one means someone else saved since. */
  baseRevision: z.number().int().min(0),
  /** Save anyway, over the other person's version. */
  force: z.boolean().default(false)
});

export const planetInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'A planet needs a name')
    .max(LORE_LIMITS.planetName),
  spec: planetSpecSchema
});

export const savePlanetSchema = planetInputSchema.extend({
  baseRevision: z.number().int().min(0),
  force: z.boolean().default(false)
});

export const publishSchema = z.object({
  /** The draft revision Haven is publishing, so it's the one the writer saw. */
  revision: z.number().int().min(1)
});

export const orderSchema = z.object({
  ids: z.array(z.string().regex(OBJECT_ID)).max(500)
});

// ---------------------------------------------------------------- snapshot

export interface PublishedForHaven {
  revision: number;
  planetRevision: number;
  order: number;
  publishedAt: string;
  publishedBy: string;
}

export interface ChapterForHaven {
  id: string;
  slug: string;
  title: string;
  line: string;
  planetId: string;
  body: string;
  order: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  /** What's on the site for it, or null while it's only a draft. */
  published: PublishedForHaven | null;
}

export interface PlanetForHaven {
  id: string;
  name: string;
  spec: PlanetSpec;
  revision: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

/** The whole lore, as every request hands it back. */
export interface LoreSnapshot {
  /** Whether Haven's lore has replaced the site's files. */
  live: boolean;
  chapters: ChapterForHaven[];
  planets: PlanetForHaven[];
}
