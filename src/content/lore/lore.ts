import { z } from 'zod';
import { planetSpecSchema } from '@/lib/planets/engine';
import { toRoman } from '@/lib/text/roman';

// The lore of Nayara (source: candy-haven/info/lore.md, plus the canon on
// its reference boards): the copy around it, and its chapters.
//
// The copy is JSON (lore.json). The chapters come from Candy Haven once it
// has published any (getLore.ts reads them from the database); until then
// from the markdown files in chapters/, read by loadLore.ts. Either way
// they arrive in the shape below, so nothing downstream knows which.
// Chapters are numbered by their place in the list, so a new one takes the
// next numeral and the orbit simply grows a node.
//
// Nothing here touches the file system, so the pages' client components
// can import its types and helpers.

const text = z.string().trim().min(1);
const link = z.object({ label: text, href: text });

/** A run of text in one voice, as the markdown wrote it. */
const run = z.object({
  text: z.string().min(1),
  voice: z.enum(['emphasis', 'strong']).optional()
});
const runs = z.array(run).min(1);

const block = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('paragraph'), runs }),
  /** A line set large, in the accent italic. */
  z.object({ kind: z.literal('quote'), runs }),
  z.object({ kind: z.literal('heading'), text }),
  z.object({ kind: z.literal('list'), items: z.array(runs).min(1) }),
  /** Named items: a term and a line or two about it. */
  z.object({
    kind: z.literal('entries'),
    items: z.array(z.object({ term: text, runs })).min(1)
  })
]);

export const chapterSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: text,
  /** The one line it's known by, on the orbit and under its title. */
  line: text,
  /** How the planet looks while it's read: a preset, or one made in Haven. */
  planet: planetSpecSchema,
  /** Its Blender render, once there is one; until then the planet is. */
  render: z.object({ src: text, alt: z.string() }).optional(),
  blocks: z.array(block).min(1)
});

export const loreCopySchema = z.object({
  intro: z.object({
    label: text,
    lead: text,
    /** Uppercased, in two lines: the "\n" is where it breaks. */
    statement: text,
    sub: text,
    cue: text
  }),
  index: z.object({
    label: text,
    chapter: text,
    read: text,
    unwritten: text
  }),
  menu: z.object({
    open: text,
    close: text,
    /** `{current}` and `{total}` become numerals. */
    position: text
  }),
  /** Under each chapter: the way on. `{numeral}` becomes a numeral. */
  reader: z.object({
    read: text,
    next: text,
    nextChapter: text,
    all: text
  }),
  /** Under the last chapter, in place of the next one. */
  end: z.object({
    /** `{total}` becomes the number of chapters, as a numeral. */
    label: text,
    line: text,
    epigraph: text,
    listen: link
  })
});

export const loreSchema = loreCopySchema.extend({
  // Possibly none: once Haven's lore is live, it has only what Haven
  // published, and the pages say the first chapter is still being written.
  chapters: z
    .array(chapterSchema)
    .refine(
      (chapters) =>
        new Set(chapters.map((c) => c.slug)).size === chapters.length,
      'Every chapter needs its own slug'
    )
});

export type LoreCopy = z.infer<typeof loreCopySchema>;
export type LoreBlock = z.infer<typeof block>;
export type LoreRun = z.infer<typeof run>;

export type LoreChapter = z.infer<typeof chapterSchema> & {
  /** Its place, from 0. */
  index: number;
  numeral: string;
};

/** A chapter without its text: what the orbit, the menu and links need. */
export type LoreChapterSummary = Omit<LoreChapter, 'blocks'>;

export type LoreContent = LoreCopy & { chapters: LoreChapter[] };

export function withNumerals(lore: z.infer<typeof loreSchema>): LoreContent {
  return {
    ...lore,
    chapters: lore.chapters.map((c, index) => ({
      ...c,
      index,
      numeral: toRoman(index + 1)
    }))
  };
}

export function summarize(chapter: LoreChapter): LoreChapterSummary {
  const { slug, title, line, planet, render, index, numeral } = chapter;
  return { slug, title, line, planet, render, index, numeral };
}

/** The copy around the chapters, without them. */
export function copyOf(content: LoreContent): LoreCopy {
  const { intro, index, menu, reader, end } = content;
  return { intro, index, menu, reader, end };
}

export const chapterHref = (slug: string) => `/lore/${slug}`;

export function findChapter<T extends { slug: string }>(
  chapters: readonly T[],
  slug: string | null | undefined
) {
  return chapters.find((c) => c.slug === slug);
}
