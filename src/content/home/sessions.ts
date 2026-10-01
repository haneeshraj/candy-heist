import { z } from 'zod';
import { findItem, type ServiceIcon } from '@/content/services/catalogue';
import sessionsData from './sessions.json';

// The home page Sessions section: a few of the services, one line each.
// Durations, formats and prices belong to the services pages. The section
// copy is plain JSON checked against this schema, and it names which
// services to feature by their catalogue ids, so the list stays four long
// however many the catalogue holds (Candy Haven can change those any
// time). Draft copy until the client confirms it.

const text = z.string().trim().min(1);

export const sessionsCopySchema = z.object({
  label: text,
  /** Beside the crimson dot, the section's one focal point. */
  status: text,
  /** Italic lead-in over the uppercased statement. */
  headline: z.object({ lead: text, statement: text }),
  intro: text,
  /** The main action: booking a DJ set. */
  cta: z.object({ label: text, href: text }),
  /** Beside it, outlined: booking a session or a commission. */
  secondary: z.object({ label: text, href: text }),
  /** The services listed, by catalogue id, in order. */
  featured: z
    .array(text.refine((id) => Boolean(findItem(id)), 'Not in the catalogue'))
    .min(1),
  photo: z.object({ src: text, alt: text })
});

export interface SessionService {
  /** Stable key, and the slug the booking page uses to preselect it. */
  id: string;
  name: string;
  /** Its one line from the catalogue. */
  summary: string;
  icon: ServiceIcon;
}

export type SessionIcon = ServiceIcon;

export type SessionsContent = Omit<
  z.infer<typeof sessionsCopySchema>,
  'featured'
> & {
  services: SessionService[];
};

const { featured, ...copy } = sessionsCopySchema.parse(sessionsData);

export const sessionsContent: SessionsContent = {
  ...copy,
  services: featured.map((id) => {
    const { name, summary, icon } = findItem(id)!;
    return { id, name, summary, icon };
  })
};
