import { z } from 'zod';
import bookingData from './booking.json';

// Copy for the booking page (/sessions), from the Figma "Design 1 · Guided
// steps" flow: intro video, choose a session, its details, date and time,
// your details, payment, confirmation. Plain JSON checked against this
// schema, so a server-side loader can hand over the same shape later.
// Strings with {braces} are templates, filled with `fill()` from
// lib/booking/format. The price and the intro video are placeholders.

const text = z.string().trim().min(1);
const field = z.object({ label: text, placeholder: text });

export const bookingContentSchema = z.object({
  /** The page's h1, for assistive tech; each step shows its own heading. */
  title: text,
  /** Accessible name of the stepper. */
  stepsLabel: text,
  /** Shown wherever the advance amount goes, until prices are set. */
  price: text,
  /** IANA zone the sessions run in; every time on the page is in it. */
  timeZone: text,
  timeZoneLabel: text,
  intro: z.object({
    video: z.object({
      /** null until the intro is filmed: the player then shows its poster. */
      src: text.nullable(),
      poster: text,
      posterAlt: text,
      eyebrow: text,
      title: text,
      duration: text,
      unavailable: text,
      chapters: z.array(z.object({ at: z.number().min(0), label: text }))
    }),
    lead: text,
    statement: text,
    body: text,
    jump: text
  }),
  choose: z.object({
    label: text,
    heading: text,
    sub: text,
    selected: text,
    next: text,
    prompt: text
  }),
  steps: z.object({
    session: text,
    date: text,
    details: text,
    payment: text
  }),
  session: z.object({
    label: text,
    included: text,
    howItRuns: text,
    goodFor: text,
    bring: text,
    cta: text,
    hint: text
  }),
  date: z.object({
    label: text,
    heading: text,
    sub: text,
    openTimes: text,
    zone: text,
    pickDay: text,
    previousMonth: text,
    nextMonth: text,
    back: text,
    cta: text
  }),
  details: z.object({
    label: text,
    heading: text,
    sub: text,
    required: text,
    optional: text,
    name: field,
    email: field,
    phone: field,
    note: field,
    errors: z.object({
      name: text,
      email: text,
      emailInvalid: text,
      phone: text,
      note: text
    }),
    back: text,
    cta: text
  }),
  payment: z.object({
    label: text,
    heading: text,
    sub: text,
    panel: text,
    card: z.object({ number: text, expiry: text, cvc: text, name: text }),
    secure: text,
    notes: z.array(z.object({ title: text, text })),
    back: text,
    cta: text,
    paying: text
  }),
  summary: z.object({
    label: text,
    date: text,
    time: text,
    length: text,
    advance: text,
    empty: text
  }),
  confirmation: z.object({
    heading: text,
    body: text,
    session: text,
    when: text,
    paid: text,
    paidValue: text,
    calendar: text,
    home: text,
    email: z.object({
      sent: text,
      subject: text,
      body: text,
      cta: text,
      signature: text
    })
  })
});

export type BookingContent = z.infer<typeof bookingContentSchema>;

export const bookingContent: BookingContent =
  bookingContentSchema.parse(bookingData);
