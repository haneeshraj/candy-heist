import { z } from 'zod';
import invoiceData from './invoice.json';

// "Pay an invoice" (/services/pay): a commission's other half, paid with
// the invoice ID Candy emails when the work is ready. Find it, pay it, and
// the page says it's done. Strings with {braces} are templates.

const text = z.string().trim().min(1);

export const invoiceCopySchema = z.object({
  meta: z.object({ title: text, description: text }),
  /** Shown wherever an amount goes, until the invoice has one. */
  price: text,
  find: z.object({
    label: text,
    heading: text,
    sub: text,
    field: z.object({ label: text, placeholder: text }),
    cta: text,
    finding: text,
    errors: z.object({ missing: text, invalid: text, notFound: text })
  }),
  pay: z.object({
    label: text,
    heading: text,
    sub: text,
    slip: z.object({
      label: text,
      /** When the invoice doesn't name the commission. */
      item: text,
      invoice: text,
      price: text,
      paid: text,
      due: text
    }),
    panel: text,
    card: z.object({ number: text, expiry: text, cvc: text, name: text }),
    secure: text,
    /** A box to tick before paying: the terms, read and accepted. */
    terms: z.object({
      accept: text.refine((value) => value.includes('{link}'), {
        message: 'needs {link}, where the terms link goes'
      }),
      link: text,
      note: text,
      error: text
    }),
    cta: text,
    paying: text,
    /** A toast, when the payment fails. */
    failed: z.object({ title: text, text }),
    back: text
  }),
  paid: z.object({
    heading: text,
    body: text,
    receipt: z.object({ invoice: text, paid: text }),
    services: text,
    home: text
  })
});

export type InvoiceCopy = z.infer<typeof invoiceCopySchema>;

export const invoiceCopy: InvoiceCopy = invoiceCopySchema.parse(invoiceData);
