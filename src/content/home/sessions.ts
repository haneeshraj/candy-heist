import { z } from 'zod';
import sessionsData from './sessions.json';

// The home page Sessions section: which 1:1 services exist, one line each.
// Durations, formats and prices belong to the booking page. The data is
// plain JSON checked against this schema, so a server-side loader (Server
// Action / database) can hand over the same shape later without touching
// the component. Draft copy until the client confirms it.

export const SESSION_ICONS = ['production', 'dj', 'feedback', 'mix'] as const;

const text = z.string().trim().min(1);

export const sessionServiceSchema = z.object({
  /** Stable key, and the slug the booking page will use to preselect it. */
  id: text,
  name: text,
  /** One line, 8 to 10 words, so the list reads evenly. */
  summary: text,
  icon: z.enum(SESSION_ICONS)
});

export const sessionsContentSchema = z.object({
  label: text,
  /** Beside the crimson dot, the section's one focal point. */
  status: text,
  /** Italic lead-in over the uppercased statement. */
  headline: z.object({ lead: text, statement: text }),
  intro: text,
  /** The one action: every service is booked from the same page. */
  cta: z.object({ label: text, href: text }),
  photo: z.object({ src: text, alt: text }),
  services: z.array(sessionServiceSchema).min(1)
});

export type SessionsContent = z.infer<typeof sessionsContentSchema>;
export type SessionService = z.infer<typeof sessionServiceSchema>;
export type SessionIcon = SessionService['icon'];

export const sessionsContent: SessionsContent =
  sessionsContentSchema.parse(sessionsData);
