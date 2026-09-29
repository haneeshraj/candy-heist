import { z } from 'zod';
import { services, type ServiceIcon } from '@/content/sessions/services';
import sessionsData from './sessions.json';

// The home page Sessions section: which 1:1 services exist, one line each.
// Durations, formats and prices belong to the booking page. The section copy
// is plain JSON checked against this schema, and the services themselves
// come from the shared catalogue, so a server-side loader (Server Action /
// database) can hand over the same shape later without touching the
// component. Draft copy until the client confirms it.

const text = z.string().trim().min(1);

export const sessionsCopySchema = z.object({
  label: text,
  /** Beside the crimson dot, the section's one focal point. */
  status: text,
  /** Italic lead-in over the uppercased statement. */
  headline: z.object({ lead: text, statement: text }),
  intro: text,
  /** The one action: every service is booked from the same page. */
  cta: z.object({ label: text, href: text }),
  photo: z.object({ src: text, alt: text })
});

export interface SessionService {
  /** Stable key, and the slug the booking page uses to preselect it. */
  id: string;
  name: string;
  /** One line, 8 to 10 words, so the list reads evenly. */
  summary: string;
  icon: ServiceIcon;
}

export type SessionIcon = ServiceIcon;

export type SessionsContent = z.infer<typeof sessionsCopySchema> & {
  services: SessionService[];
};

export const sessionsContent: SessionsContent = {
  ...sessionsCopySchema.parse(sessionsData),
  services: services.map(({ id, name, summary, icon }) => ({
    id,
    name,
    summary,
    icon
  }))
};
