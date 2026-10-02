import { z } from 'zod';
import type { EnquiryField } from '@/lib/enquiry/enquiry';
import enquiryData from './djEnquiry.json';

// "Book me as a DJ" (/services/dj): an enquiry, not a booking, so there's
// no payment. The headline, the form (who's asking, then the event), a
// photo beside it with the email for anyone who'd rather write, and what
// the page says once the enquiry has gone. Strings with {braces} are
// templates.

const text = z.string().trim().min(1);
const field = z.object({ label: text, placeholder: text });

export const djEnquirySchema = z.object({
  meta: z.object({ title: text, description: text }),
  intro: z.object({
    /** Italic lead-in over the uppercased statement. */
    lead: text,
    statement: text,
    body: text
  }),
  form: z.object({
    label: text,
    heading: text,
    sub: text,
    required: text,
    groups: z.object({ you: text, event: text }),
    fields: z.object({
      name: field,
      title: field,
      email: field,
      phone: field,
      eventName: field,
      eventVenue: field,
      budget: field,
      about: field
    } satisfies Record<EnquiryField, typeof field>),
    errors: z.object({
      name: text,
      email: text,
      emailInvalid: text,
      phone: text,
      budget: text,
      about: text,
      tooLong: text
    }),
    send: text,
    sending: text,
    /** A toast, when the enquiry fails to send. */
    failed: z.object({ title: text, text }),
    /** A toast, when one visitor has sent too many in the hour. */
    limited: z.object({ title: text, text })
  }),
  aside: z.object({
    photo: z.object({ src: text, alt: text }),
    /** Over the email, for anyone who'd rather write. */
    write: text
  }),
  sent: z.object({
    heading: text,
    body: text,
    questions: text,
    discord: text,
    /** Announced when a contact is copied. */
    copied: text,
    services: text,
    home: text,
    /** What was sent, as a slip beside the message. */
    slip: z.object({
      sent: text,
      subject: text,
      event: text,
      venue: text,
      budget: text,
      from: text
    })
  })
});

export type DjEnquiryContent = z.infer<typeof djEnquirySchema>;

export const djEnquiryContent: DjEnquiryContent =
  djEnquirySchema.parse(enquiryData);
