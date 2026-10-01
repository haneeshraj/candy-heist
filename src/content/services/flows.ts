import { z } from 'zod';
import commissionsData from './commissionsFlow.json';
import sessionsData from './sessionsFlow.json';

// Copy for the two flows under /services: sessions (pick one, a date and
// time, your details, payment) and commissions (pick one, your details,
// payment). They share one shape; the parts only a session has (the intro
// video, the date step, the choice of where to meet, the calendar) are
// optional, and present in the sessions copy only. Strings with {braces}
// are templates, filled with `fill()` from lib/booking/format. The price
// and the intro video are placeholders.

const text = z.string().trim().min(1);
const field = z.object({ label: text, placeholder: text });

export const flowContentSchema = z.object({
  /** The page's h1, for assistive tech; each step shows its own heading. */
  title: text,
  /** Accessible name of the stepper. */
  stepsLabel: text,
  /** Shown wherever a price goes, until prices are set. */
  price: text,
  /** IANA zone sessions run in; every time on the page is in it. */
  timeZone: text,
  timeZoneLabel: text,
  intro: z.object({
    video: z
      .object({
        /** null until the intro is filmed: the player then shows its poster. */
        src: text.nullable(),
        poster: text,
        posterAlt: text,
        eyebrow: text,
        title: text,
        duration: text,
        unavailable: text,
        chapters: z.array(z.object({ at: z.number().min(0), label: text }))
      })
      .optional(),
    lead: text,
    statement: text,
    body: text,
    /** Under the intro, a cue down to the choice. */
    cue: text.optional()
  }),
  choose: z.object({
    label: text,
    heading: text,
    sub: text,
    /** Each card's way in. */
    view: text
  }),
  steps: z.object({
    item: text,
    date: text.optional(),
    details: text,
    payment: text
  }),
  item: z.object({
    /** Over the list of items beside the details. */
    label: text,
    /** The price's label among the facts: "Advance", "Price". */
    price: text,
    cta: text
  }),
  date: z
    .object({
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
    })
    .optional(),
  details: z.object({
    label: text,
    heading: text,
    sub: text,
    /** The sub once Discord is picked to meet on. */
    subDiscord: text.optional(),
    required: text,
    name: field,
    email: field,
    /** Sessions only: where the call happens. */
    meetOn: z
      .object({
        label: text,
        meet: text,
        discord: text,
        helpMeet: text,
        helpDiscord: text
      })
      .optional(),
    instagram: field,
    discord: field,
    phone: field,
    note: field,
    errors: z.object({
      name: text,
      email: text,
      emailInvalid: text,
      instagram: text,
      discord: text,
      discordRequired: text,
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
    date: text.optional(),
    time: text.optional(),
    /** Where a session meets, once it's picked. */
    meetOn: text.optional(),
    total: text,
    empty: text
  }),
  confirmation: z.object({
    heading: text,
    body: text,
    bodyDiscord: text.optional(),
    questions: text,
    discord: text,
    /** Announced when a contact is copied. */
    copied: text,
    calendar: text.optional(),
    services: text.optional(),
    home: text,
    receipt: z.object({
      item: text,
      reference: text,
      paid: text,
      paidValue: text
    }),
    email: z.object({
      sent: text,
      subject: text,
      body: text,
      bodyDiscord: text.optional(),
      /** The email's button, when it has one (a session's call link). */
      cta: text.optional(),
      ctaDiscord: text.optional(),
      signature: text
    })
  })
});

export type FlowContent = z.infer<typeof flowContentSchema>;

export const sessionsFlowContent: FlowContent =
  flowContentSchema.parse(sessionsData);
export const commissionsFlowContent: FlowContent =
  flowContentSchema.parse(commissionsData);
