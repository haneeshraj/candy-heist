import { z } from 'zod';
import servicesData from './services.json';

// The services page (/services): the headline, a door to each kind of
// service (commissions, sessions, and sounds and presets, coming soon),
// and how it works. Plain JSON checked against this schema, so a
// server-side loader can hand over the same shape later.

const text = z.string().trim().min(1);

const door = z.object({
  kicker: text,
  title: text,
  line: text,
  cta: z.object({ label: text, href: text }),
  /** Not offered yet: the door is sealed, with no photo. */
  soon: z.boolean().optional(),
  photo: z.object({ src: text, alt: text }).optional()
});

export const servicesPageSchema = z.object({
  meta: z.object({ title: text, description: text }),
  label: text,
  /** Italic lead-in over the uppercased statement. */
  lead: text,
  statement: text,
  intro: text,
  doors: z
    .array(door)
    .min(1)
    .refine((doors) => doors.every((d) => d.soon || d.photo), {
      message: 'An open door needs its photo'
    }),
  how: z.object({
    label: text,
    steps: z.array(z.object({ title: text, text })).min(1)
  })
});

export type ServicesPageContent = z.infer<typeof servicesPageSchema>;
export type ServicesDoor = ServicesPageContent['doors'][number];

export const servicesPageContent: ServicesPageContent =
  servicesPageSchema.parse(servicesData);
