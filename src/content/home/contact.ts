import { z } from 'zod';
import { siteContact, type SiteContact } from '@/content/site/contact';
import contactData from './contact.json';

// The home page Contact section: its copy, plus the email and phone from the
// site's shared contact details. Plain JSON checked against this schema, so
// a server-side loader can hand over the same shape later without touching
// the component. Draft copy until the client confirms it.

const text = z.string().trim().min(1);

export const contactCopySchema = z.object({
  label: text,
  /** Italic lead-in over the uppercased statement. */
  headline: z.object({ lead: text, statement: text }),
  intro: text,
  /** The one main action, bottom right. */
  cta: z.object({ label: text, href: text })
});

export type ContactContent = z.infer<typeof contactCopySchema> & SiteContact;

export const contactContent: ContactContent = {
  ...contactCopySchema.parse(contactData),
  ...siteContact
};
