import { z } from 'zod';
import { findItem, type ServiceIcon } from '@/content/services/catalogue';
import testimonialsData from './testimonials.json';

// The home page Testimonials section: its copy, and what people said, each
// quote tied to the service it's about (by the booking catalogue's id), so
// the section can name the service beside who said it. Plain JSON checked against
// this schema, so a server-side loader can hand over the same shape later.
//
// PLACEHOLDERS: every quote and name here is made up to lay the section
// out. Swap in real testimonials, with permission, before this goes live.

const text = z.string().trim().min(1);

export const testimonialSchema = z.object({
  quote: text,
  /** How they're credited: initials or a name, as they agreed to. */
  name: text,
  /** What they do: "Artist", "DJ", "Producer". */
  role: text,
  /** The booking catalogue's id for the service the quote is about. */
  service: text.refine((id) => Boolean(findItem(id)), {
    message: 'Not a service in content/services/catalogue.json'
  })
});

export const testimonialsCopySchema = z.object({
  label: text,
  /** Italic lead-in over the uppercased statement. */
  headline: z.object({ lead: text, statement: text }),
  /** The one action: every service is booked from the same page. */
  cta: z.object({ label: text, href: text }),
  photo: z.object({ src: text, alt: text }),
  controls: z.object({
    /** Each quote's name as a slide: "{n} of {total}". */
    slide: text,
    /** A dot's label: "Show quote {n} of {total}". */
    show: text,
    pause: text,
    play: text
  }),
  testimonials: z.array(testimonialSchema).min(1)
});

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  service: {
    id: string;
    name: string;
    icon: ServiceIcon;
  };
}

export type TestimonialsContent = Omit<
  z.infer<typeof testimonialsCopySchema>,
  'testimonials'
> & { testimonials: Testimonial[] };

const copy = testimonialsCopySchema.parse(testimonialsData);

export const testimonialsContent: TestimonialsContent = {
  ...copy,
  testimonials: copy.testimonials.map((t) => {
    const service = findItem(t.service)!;
    return {
      ...t,
      service: {
        id: service.id,
        name: service.name,
        icon: service.icon
      }
    };
  })
};
