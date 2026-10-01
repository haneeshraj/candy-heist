import { z } from 'zod';
import systemData from './system.json';

// What the site says when a page isn't there (the 404) and when something
// breaks (the error screens). Plain JSON checked against this schema, like
// the rest of the copy. `{digest}` is filled with the error's reference.

const text = z.string().trim().min(1);

export const systemCopySchema = z.object({
  notFound: z.object({
    /** The browser tab. */
    title: text,
    label: text,
    /** Italic lead-in over the uppercased statement. */
    lead: text,
    statement: text,
    body: text,
    home: text,
    discography: text,
    /** Names the turning logo for assistive tech. */
    alt: text
  }),
  /** The toasts' region and their ×, for assistive tech. */
  toast: z.object({ region: text, close: text }),
  /** Either side of the navbar when a page rests at its end: "Scroll", "for more". */
  scrollHint: z.object({ lead: text, trail: text }),
  error: z.object({
    title: text,
    label: text,
    lead: text,
    statement: text,
    body: text,
    retry: text,
    home: text,
    reference: text
  })
});

export type SystemCopy = z.infer<typeof systemCopySchema>;

export const systemCopy: SystemCopy = systemCopySchema.parse(systemData);
