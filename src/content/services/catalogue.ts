import { z } from 'zod';
import { parseMarkdownBlocks, type TextBlock } from '@/lib/markdown/blocks';
import catalogueData from './catalogue.json';

// Everything Candy Heist offers, in two kinds: commissions (made for you:
// sent off, done, sent back) and sessions (made with you: one on one, at a
// booked time). Sounds and presets come later.
//
// PLACEHOLDERS: Candy Haven will let the client add, change and remove
// items as he likes, so nothing on the site may assume these six, or how
// many there are. Each item's write-up (what it is, what's included, and
// anything else) is one markdown body, the way it would be typed into
// Candy Haven; the title, the facts and the price stay fields, because the
// cards, the summary and the payment need them on their own. Prices are
// unset, so the flows show their placeholder.

export const SERVICE_ICONS = ['production', 'dj', 'feedback', 'mix'] as const;
export const SERVICE_KINDS = ['commission', 'session'] as const;

const text = z.string().trim().min(1);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const serviceItemSchema = z.object({
  /** Stable key, used in the page's URL (?commission=, ?session=). */
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
  /** The fixed price, once it's set. */
  price: text.optional()
});

export const sessionItemSchema = serviceItemSchema.extend({
  /** The booked slot's length, for the calendar invite. */
  durationMinutes: z.number().int().positive()
});

export const catalogueSchema = z
  .object({
    commissions: z.array(serviceItemSchema).min(1),
    sessions: z.array(sessionItemSchema).min(1)
  })
  .refine(
    ({ commissions, sessions }) => {
      const ids = [...commissions, ...sessions].map((item) => item.id);
      return new Set(ids).size === ids.length;
    },
    { message: 'Every service needs its own id' }
  );

export type ServiceKind = (typeof SERVICE_KINDS)[number];
export type ServiceIcon = (typeof SERVICE_ICONS)[number];

export type ServiceItem = Omit<z.infer<typeof serviceItemSchema>, 'body'> & {
  kind: ServiceKind;
  /** The write-up, read from its markdown. */
  blocks: TextBlock[];
  /** Sessions only. */
  durationMinutes?: number;
};

const parsed = catalogueSchema.parse(catalogueData);

const withBlocks =
  (kind: ServiceKind) =>
  ({ body, ...item }: z.infer<typeof serviceItemSchema>): ServiceItem => ({
    ...item,
    kind,
    blocks: parseMarkdownBlocks(body, `The write-up for ${item.name}`)
  });

export const commissions: ServiceItem[] = parsed.commissions.map(
  withBlocks('commission')
);
export const sessions: ServiceItem[] = parsed.sessions.map(
  withBlocks('session')
);

export const itemsOf = (kind: ServiceKind) =>
  kind === 'session' ? sessions : commissions;

export function findItem(id: string | null | undefined) {
  return [...commissions, ...sessions].find((item) => item.id === id);
}
