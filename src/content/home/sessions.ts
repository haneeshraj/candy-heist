import { z } from 'zod';
import type { ServiceIcon } from '@/lib/services/kinds';
import type { ServiceItem } from '@/lib/services/model';
import sessionsData from './sessions.json';

// The home page Sessions section: a few of the services, one line each.
// Durations, formats and prices belong to the services pages. The section
// copy is plain JSON checked against this schema, and it names which
// services to feature by their addresses, so the list stays four long
// however many there are. The services themselves come from Candy Haven
// (or the site's own list): one that's no longer offered drops off the
// list here rather than breaking the page. Draft copy until the client
// confirms it.

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
  /** The services listed, by their addresses, in order. */
  featured: z.array(text).min(1),
  photo: z.object({ src: text, alt: text })
});

export interface SessionService {
  /** Stable key, and the slug the booking page uses to preselect it. */
  id: string;
  name: string;
  /** Its one line from the services. */
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

/** The section, with the featured services that are on offer. */
export function sessionsContentFor(items: ServiceItem[]): SessionsContent {
  return {
    ...copy,
    services: featured.flatMap((id) => {
      const item = items.find((entry) => entry.id === id);
      return item
        ? [{ id, name: item.name, summary: item.summary, icon: item.icon }]
        : [];
    })
  };
}
