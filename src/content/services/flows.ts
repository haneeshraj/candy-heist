import { z } from 'zod';
import producerData from './producerFlow.json';

// Copy for "Book me as a music producer" (/services/producer): the intro
// and the list of services, then one service's details, a date and time
// (1-1 sessions only), your details, payment and the confirmation. What a
// commission and a session say differently (the payment terms, where to
// meet, the confirmation) sits under `kinds`; `flowCopy()` lays it over
// the shared copy for the kind of service picked. Strings with {braces}
// are templates, filled with `fill()` from lib/booking/format. The price
// and the intro video are placeholders.

const text = z.string().trim().min(1);
const field = z.object({ label: text, placeholder: text });
const notes = z.array(z.object({ title: text, text })).min(1);

const kindSchema = z.object({
  /** On its card and among its facts: "Commission", "1-1 session". */
  tag: text,
  /** Over its kind in the list beside the details: "Commissions". */
  group: text,
  item: z.object({
    cta: text,
    /** The price among the facts: "{price}, half upfront". */
    price: text
  }),
  details: z.object({
    sub: text,
    /** The sub once Discord is picked to meet on. */
    subDiscord: text.optional(),
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
    note: field
  }),
  payment: z.object({ heading: text, sub: text, panel: text, notes }),
  summary: z.object({ label: text, total: text }),
  confirmation: z.object({
    heading: text,
    body: text,
    bodyDiscord: text.optional(),
    receipt: z.object({ item: text, paidValue: text }),
    email: z.object({
      subject: text,
      body: text,
      bodyDiscord: text.optional(),
      /** The email's button, when it has one (a session's call link). */
      cta: text.optional(),
      ctaDiscord: text.optional()
    })
  })
});

export const producerFlowSchema = z.object({
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
    /** Under the intro, a cue down to the choice. */
    cue: text
  }),
  choose: z.object({
    label: text,
    heading: text,
    sub: text,
    /** Each card's way in. */
    view: text
  }),
  /** Searching, filtering and sorting the list. */
  browse: z.object({
    search: z.object({
      open: text,
      label: text,
      placeholder: text,
      submit: text,
      clear: text
    }),
    filters: z.object({
      button: text,
      region: text,
      sort: text,
      sorts: z.object({
        featured: text,
        name: text,
        priceLow: text,
        priceHigh: text
      }),
      kind: text,
      count: text,
      clear: text,
      remove: text,
      empty: text
    })
  }),
  steps: z.object({
    item: text,
    date: text,
    details: text,
    payment: text
  }),
  item: z.object({
    /** Names the list beside the details. */
    label: text,
    type: text,
    price: text
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
    required: text,
    name: field,
    email: field,
    instagram: field,
    discord: field,
    phone: field,
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
    card: z.object({ number: text, expiry: text, cvc: text, name: text }),
    secure: text,
    /** Under the button: payments are final, with a link to the terms. */
    terms: z.object({ text, link: text }),
    back: text,
    cta: text,
    paying: text
  }),
  summary: z.object({
    date: text,
    time: text,
    /** Where a session meets, once it's picked. */
    meetOn: text,
    price: text,
    /** What a commission leaves for delivery. */
    later: text,
    empty: text
  }),
  confirmation: z.object({
    questions: text,
    discord: text,
    /** Announced when a contact is copied. */
    copied: text,
    /** Sessions: the call into the calendar. */
    calendar: text,
    /** Commissions: back to the services. */
    services: text,
    home: text,
    receipt: z.object({ reference: text, paid: text }),
    email: z.object({ sent: text, signature: text })
  }),
  kinds: z.object({ commission: kindSchema, session: kindSchema })
});

export type ProducerFlowContent = z.infer<typeof producerFlowSchema>;
export type KindCopy = z.infer<typeof kindSchema>;
type Content = ProducerFlowContent;

/** The copy of the steps that read differently for each kind. */
export interface FlowCopy {
  details: Content['details'] & KindCopy['details'];
  payment: Content['payment'] & KindCopy['payment'];
  summary: Content['summary'] & KindCopy['summary'];
  confirmation: Omit<Content['confirmation'], 'receipt' | 'email'> &
    Omit<KindCopy['confirmation'], 'receipt' | 'email'> & {
      receipt: Content['confirmation']['receipt'] &
        KindCopy['confirmation']['receipt'];
      email: Content['confirmation']['email'] &
        KindCopy['confirmation']['email'];
    };
}

/** The shared copy with a kind's own laid over it. */
export function flowCopy(
  content: Content,
  kind: keyof Content['kinds']
): FlowCopy {
  const own = content.kinds[kind];
  return {
    details: { ...content.details, ...own.details },
    payment: { ...content.payment, ...own.payment },
    summary: { ...content.summary, ...own.summary },
    confirmation: {
      ...content.confirmation,
      ...own.confirmation,
      receipt: {
        ...content.confirmation.receipt,
        ...own.confirmation.receipt
      },
      email: { ...content.confirmation.email, ...own.confirmation.email }
    }
  };
}

export const producerFlowContent: ProducerFlowContent =
  producerFlowSchema.parse(producerData);
