import { z } from 'zod';
import servicesData from './services.json';

// The 1:1 services, in the order they're offered. The single source for the
// home page Sessions section (name and one line) and the booking page
// (everything). Plain JSON checked against this schema, so a database can
// hand over the same shape later. Only the Production Session's length and
// format are confirmed; the rest is draft copy until the client signs off.

export const SERVICE_ICONS = ['production', 'dj', 'feedback', 'mix'] as const;

const text = z.string().trim().min(1);

export const serviceSchema = z.object({
  /** Stable key, used in the booking page URL (?session=). */
  id: text,
  name: text,
  icon: z.enum(SERVICE_ICONS),
  /** The home page line: 8 to 10 words so the list reads evenly. */
  summary: text,
  /** The shorter line on the booking cards. */
  tagline: text,
  /** Length and format, set small above the name. */
  meta: text,
  /** Length of the booked slot, for the calendar invite. */
  durationMinutes: z.number().int().positive(),
  photos: z.object({ portrait: text, wide: text, alt: text }),
  overview: z.array(text).min(1),
  included: z.array(text).min(1),
  howItRuns: z.array(z.object({ at: text, title: text, text })),
  goodFor: z.array(text),
  bring: z.array(text),
  facts: z.array(z.object({ label: text, value: text })).min(1)
});

export type Service = z.infer<typeof serviceSchema>;
export type ServiceIcon = Service['icon'];

export const services: Service[] = z
  .array(serviceSchema)
  .min(1)
  .parse(servicesData);

export function findService(id: string | null | undefined) {
  return services.find((service) => service.id === id);
}
