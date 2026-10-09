import { z } from 'zod';
import { hoursSchema, type Hours } from '@/lib/booking/hours';
import { parseMarkdownBlocks, type TextBlock } from '@/lib/markdown/blocks';
import { SERVICE_ICONS } from './kinds';

// What "Book me as a music producer" offers, as data: each service, and
// the hours sessions can be booked in. The site's own files hold a first
// list (content/services); once Candy Haven publishes, the site shows
// Haven's instead. Either way it's checked against these rules, so the
// pages, the booking and Haven all agree on what a service is.
//
// Each service is a commission (made for you, half paid upfront) or a 1-1
// session (made with you, at a booked time, paid in full). Its write-up is
// one markdown body; the name, the facts and the price stay fields, because
// the cards, the summary and the payment need them on their own.
//
// Pure: the loaders, the store, the routes and the tests all use it.

export const SERVICE_LIMITS = {
  /** Services on the site at once. */
  items: 40,
  id: 60,
  name: 80,
  summary: 160,
  facts: 6,
  factLabel: 24,
  factValue: 80,
  /** A photo's address. */
  photo: 600,
  alt: 200,
  body: 20_000,
  /** The highest price, in dollars. */
  price: 100_000,
  /** A session's length, in minutes. */
  minutes: { min: 15, max: 480 },
  /** Start times offered on one day of the week. */
  timesPerDay: 48,
  /** Days off listed at once. */
  closed: 400,
  /** The longest notice a session can ask for, in hours: two weeks. */
  noticeHours: 336,
  /** The longest break between sessions, in minutes. */
  bufferMinutes: 240
} as const;

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const text = (max: number, missing: string) =>
  z.string().trim().min(1, missing).max(max);

/** In dollars, to the cent. */
const price = z
  .number()
  .positive('A price is more than zero')
  .max(SERVICE_LIMITS.price)
  .refine(
    (dollars) => Math.abs(dollars * 100 - Math.round(dollars * 100)) < 1e-6,
    'A price is in dollars and cents'
  );

const itemFields = {
  /** Its address: the page's ?service=, kept once made so links keep working. */
  id: z
    .string()
    .trim()
    .min(1, 'A service needs an address')
    .max(SERVICE_LIMITS.id)
    .regex(SLUG_PATTERN, 'An address is lowercase words joined by dashes'),
  name: text(SERVICE_LIMITS.name, 'A service needs a name'),
  icon: z.enum(SERVICE_ICONS),
  /** One line, under the name on its card. */
  summary: text(SERVICE_LIMITS.summary, 'Give the service its one line'),
  /** Shown as label and value: "Length · 90 min", "Via · Discord or …". */
  facts: z
    .array(
      z.object({
        label: text(SERVICE_LIMITS.factLabel, 'A fact needs a label'),
        value: text(SERVICE_LIMITS.factValue, 'A fact needs a value')
      })
    )
    .min(1, 'A service needs at least one fact, like its format or length')
    .max(SERVICE_LIMITS.facts),
  /** Its card (portrait) and its banner (wide), and what they show. */
  photos: z.object({
    card: text(SERVICE_LIMITS.photo, 'A service needs its photo'),
    wide: text(SERVICE_LIMITS.photo, 'A service needs its photo'),
    alt: text(SERVICE_LIMITS.alt, 'Say what the photo shows')
  }),
  /** Markdown: what it is, what's included and anything else. */
  body: text(SERVICE_LIMITS.body, 'A service needs its write-up'),
  /** The full price in dollars, once it's set; without one it can't be paid for online. */
  price: price.optional()
};

export const serviceItemSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('commission'), ...itemFields }),
  z.object({
    kind: z.literal('session'),
    ...itemFields,
    /** The booked slot's length, for the calendar and the open times. */
    durationMinutes: z
      .number()
      .int()
      .min(
        SERVICE_LIMITS.minutes.min,
        'A session runs between 15 minutes and 8 hours'
      )
      .max(
        SERVICE_LIMITS.minutes.max,
        'A session runs between 15 minutes and 8 hours'
      )
  })
]);

/** A service as written: its write-up still markdown. */
export type ServiceItemInput = z.infer<typeof serviceItemSchema>;

/** Every service on the site, in order. */
export const serviceListSchema = z
  .array(serviceItemSchema)
  .min(1, 'Keep at least one service on the website')
  .max(SERVICE_LIMITS.items)
  .refine(
    (items) => new Set(items.map((item) => item.id)).size === items.length,
    'Two services share an address'
  );

/** A service as the pages use it. */
export type ServiceItem = Omit<ServiceItemInput, 'body' | 'durationMinutes'> & {
  /** The write-up, read from its markdown. */
  blocks: TextBlock[];
  /** Sessions only. */
  durationMinutes?: number;
};

/**
 * The service with its write-up read. Throws MarkdownBlocksError when the
 * markdown holds something the pages can't show.
 */
export function readServiceItem({
  body,
  ...item
}: ServiceItemInput): ServiceItem {
  return {
    ...item,
    blocks: parseMarkdownBlocks(body, `The write-up for ${item.name}`)
  };
}

const times = hoursSchema.shape.weekly.shape.mon
  .max(SERVICE_LIMITS.timesPerDay)
  .refine(
    (day) => new Set(day).size === day.length,
    'A day lists each time once'
  );

/**
 * The hours as Candy Haven sets them: everything but how long a time is
 * held while someone pays, which stays the site's own.
 */
export const publishedHoursSchema = hoursSchema
  .omit({ holdMinutes: true })
  .extend({
    weekly: z.object({
      mon: times,
      tue: times,
      wed: times,
      thu: times,
      fri: times,
      sat: times,
      sun: times
    }),
    closed: hoursSchema.shape.closed.max(SERVICE_LIMITS.closed),
    noticeHours: hoursSchema.shape.noticeHours.max(SERVICE_LIMITS.noticeHours),
    bufferMinutes: hoursSchema.shape.bufferMinutes.max(
      SERVICE_LIMITS.bufferMinutes
    )
  });

export type PublishedHours = z.infer<typeof publishedHoursSchema>;

/** The hours without the site's own setting, as Haven sees them. */
export const publishedHoursOf = (hours: Hours): PublishedHours => ({
  timeZone: hours.timeZone,
  weekly: hours.weekly,
  closed: hours.closed,
  noticeHours: hours.noticeHours,
  horizonMonths: hours.horizonMonths,
  bufferMinutes: hours.bufferMinutes
});

/** What Haven sends to publish: every service on the site, and the hours. */
export const publishServicesSchema = z.object({
  items: serviceListSchema,
  hours: publishedHoursSchema,
  /** The published revision Haven's list started from: 0 before the first publish. */
  baseRevision: z.number().int().min(0),
  /** Publish anyway, over a newer list someone else published. */
  force: z.boolean().default(false)
});

export type PublishServicesInput = z.infer<typeof publishServicesSchema>;

// ---------------------------------------------------------------- snapshot

/** What the site offers, as every services request hands it back. */
export interface ServicesSnapshot {
  /** Whether Haven's services have replaced the site's own. */
  live: boolean;
  /** Goes up by one on every publish; 0 before the first. */
  revision: number;
  publishedAt: string | null;
  /** Who published last: a Firebase account id from Haven. */
  publishedBy: string | null;
  /** In their order on the site: Haven's, or the site's own before the first publish. */
  items: ServiceItemInput[];
  hours: PublishedHours;
}
