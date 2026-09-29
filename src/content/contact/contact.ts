import { z } from 'zod';
import { siteContact, type SiteContact } from '@/content/site/contact';
import contactData from './contact.json';

// The contact page: its heading, the form's copy (labels, placeholders and
// errors) and the sent confirmation, plus the site's shared email and phone.
// Plain JSON checked against this schema, so a server-side loader can hand
// over the same shape later without touching the components. Draft copy
// until the client confirms it.

const text = z.string().trim().min(1);
const field = z.object({ label: text, placeholder: text });

export const contactPageSchema = z.object({
  label: text,
  /** Italic lead-in over the uppercased statement. */
  headline: z.object({ lead: text, statement: text }),
  intro: text,
  form: z.object({
    required: text,
    fields: z.object({
      name: field,
      email: field,
      subject: field,
      message: field,
      phone: field,
      organisation: field,
      date: field,
      location: field,
      budget: field,
      links: field
    }),
    /** The toggle over the optional fields. */
    details: text,
    privacy: text,
    send: text,
    sending: text,
    errors: z.object({
      name: text,
      email: text,
      emailInvalid: text,
      subject: text,
      message: text,
      phone: text,
      tooLong: text
    }),
    /** By the button after a try: `{count}` becomes a word from `counts`. */
    summary: z.object({ one: text, other: text, counts: z.array(text).min(1) })
  }),
  sent: z.object({
    label: text,
    /** `{name}` becomes the sender's first name. */
    lead: text,
    statement: text,
    /** `{email}` and `{phone}` are filled in. */
    body: text,
    again: text,
    home: z.object({ label: text, href: text })
  })
});

export type ContactPageCopy = z.infer<typeof contactPageSchema>;
export type ContactFormCopy = ContactPageCopy['form'];
export type ContactSentCopy = ContactPageCopy['sent'];

export type ContactPageContent = ContactPageCopy & SiteContact;

export const contactPageContent: ContactPageContent = {
  ...contactPageSchema.parse(contactData),
  ...siteContact
};
