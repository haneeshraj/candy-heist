import { z } from 'zod';
import termsData from './terms.json';

// The terms (/terms): how commissions and 1-1 sessions are paid, that
// payments are final, and what happens when a session is missed or a
// commission goes quiet without word. {email} is filled with the site's
// booking address. Draft wording, for the client (and ideally someone who
// knows the law) to check before launch.

const text = z.string().trim().min(1);

export const termsSchema = z.object({
  meta: z.object({ title: text, description: text }),
  label: text,
  /** Italic lead-in over the uppercased statement. */
  lead: text,
  statement: text,
  intro: text,
  updated: text,
  sections: z
    .array(z.object({ heading: text, paragraphs: z.array(text).min(1) }))
    .min(1),
  cta: z.object({ label: text, href: text })
});

export type TermsContent = z.infer<typeof termsSchema>;

export const termsContent: TermsContent = termsSchema.parse(termsData);
