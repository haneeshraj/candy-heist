import { z } from 'zod';
import { releases, type Release } from '@/content/discography/releases';
import discographyData from './discography.json';

// The home page Discography section: its copy, and the releases on the shelf
// (from the catalogue). Plain JSON checked against this schema, so a
// server-side loader can hand over the same shape later without touching
// the component. Draft copy until the client confirms it.

const text = z.string().trim().min(1);

export const discographyCopySchema = z.object({
  label: text,
  /** Italic lead-in over the uppercased statement. */
  headline: z.object({ lead: text, statement: text }),
  intro: text,
  /** The shelf's accessible name, with how to move it by keyboard. */
  shelfLabel: text,
  cta: z.object({ label: text, href: text })
});

export type DiscographyContent = z.infer<typeof discographyCopySchema> & {
  releases: Release[];
};

export const discographyContent: DiscographyContent = {
  ...discographyCopySchema.parse(discographyData),
  releases
};
