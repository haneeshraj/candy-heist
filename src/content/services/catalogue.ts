import { z } from 'zod';
import { parseMarkdownBlocks, type TextBlock } from '@/lib/markdown/blocks';
import catalogueData from './catalogue.json';

// Everything offered under "Book me as a music producer", as one list.
// Each item is one of two kinds: a commission (made for you: sent off,
// done, sent back; half paid upfront) or a 1-1 session (made with you, at
// a booked time; paid in full).
//
// PLACEHOLDERS: Candy Haven will let the client add, change and remove
// items as he likes, and set each one's kind, so nothing on the site may
// assume these six, their order, or how many of each kind there are. Each
// item's write-up (what it is, what's included, and anything else) is one
// markdown body, the way it would be typed into Candy Haven; the title,
// the facts and the price stay fields, because the cards, the summary and
// the payment need them on their own. Prices are unset, so the flow shows
// its placeholder.

export const SERVICE_ICONS = ['production', 'dj', 'feedback', 'mix'] as const;
export const SERVICE_KINDS = ['commission', 'session'] as const;

const text = z.string().trim().min(1);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const itemFields = {
  /** Stable key, used in the page's URL (?service=). */
  id: slug,
  name: text,
  icon: z.enum(SERVICE_ICONS),
  /** One line, under the name on its card. */
  summary: text,
  /** Shown as label and value: "Length · 90 min", "Via · Discord or …". */
  facts: z.array(z.object({ label: text, value: text })).min(1),
  photos: z.object({ card: text, wide: text, alt: text }),
  /** Markdown: what it is, what's included and anything else. */
  body: text,
  /** The full price in dollars, once it's set. */
  price: z.number().positive().optional()
};

export const catalogueItemSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('commission'), ...itemFields }),
  z.object({
    kind: z.literal('session'),
    ...itemFields,
    /** The booked slot's length, for the calendar invite. */
    durationMinutes: z.number().int().positive()
  })
]);

export const catalogueSchema = z.object({
  items: z
    .array(catalogueItemSchema)
    .min(1)
    .refine(
      (items) => new Set(items.map((item) => item.id)).size === items.length,
      { message: 'Every service needs its own id' }
    )
});

export type ServiceKind = (typeof SERVICE_KINDS)[number];
export type ServiceIcon = (typeof SERVICE_ICONS)[number];

type CatalogueItem = z.infer<typeof catalogueItemSchema>;

export type ServiceItem = Omit<CatalogueItem, 'body' | 'durationMinutes'> & {
  /** The write-up, read from its markdown. */
  blocks: TextBlock[];
  /** Sessions only. */
  durationMinutes?: number;
};

const withBlocks = ({ body, ...item }: CatalogueItem): ServiceItem => ({
  ...item,
  blocks: parseMarkdownBlocks(body, `The write-up for ${item.name}`)
});

/** Every item, in the client's order. */
export const catalogue: ServiceItem[] = catalogueSchema
  .parse(catalogueData)
  .items.map(withBlocks);

export function findItem(id: string | null | undefined) {
  return catalogue.find((item) => item.id === id);
}
