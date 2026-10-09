import 'server-only';
import { flowCopy, producerFlowContent } from '@/content/services/flows';
import { invoiceCopy } from '@/content/services/invoice';
import type {
  BookingDocument,
  BookingEffects,
  InvoiceDocument
} from '@/lib/db/collections';
import type { OutgoingEmail } from '@/lib/google/gmail';
import { renderEmail } from '@/lib/email/template';
import { invoiceRefFor } from '@/lib/invoices/store';
import { absolute } from '@/lib/site/url';
import { fill } from '@/lib/text/fill';
import { formatDayLong } from '../dates';
import { formatAmount } from '../price';
import { clockIn, dayIn, zoneName } from '../zone';

// What each email says. The client's are the confirmation page's email,
// sent for real (same copy, filled in); Candy's are for him: everything
// about the booking at a glance, in his own time, with a reply going
// straight to the client.

/** "Thursday 8 October", "14:00", "Atlantic Time": `at` as `zone` reads it. */
export function whenIn(at: Date, zone: string) {
  return {
    date: formatDayLong(dayIn(at, zone)),
    time: clockIn(at, zone),
    zone: zoneName(zone, at)
  };
}

export function clientBookingEmail(
  booking: BookingDocument,
  effects: BookingEffects
): OutgoingEmail {
  const copy = flowCopy(producerFlowContent, booking.kind).confirmation;
  const { details, amounts } = booking;
  const onDiscord = booking.kind === 'session' && details.meetOn === 'discord';
  const when = booking.start
    ? whenIn(booking.start, booking.visitorTimeZone)
    : null;
  const invoice = effects.invoiceRef ?? invoiceRefFor(booking.ref);

  const body = fill(
    onDiscord && copy.email.bodyDiscord
      ? copy.email.bodyDiscord
      : copy.email.body,
    { ...(when ?? {}), invoice }
  );
  const rows = [
    { label: copy.receipt.item, value: booking.itemName },
    { label: copy.receipt.reference, value: booking.ref },
    {
      label: copy.receipt.paid,
      value: fill(copy.receipt.paidValue, {
        price: formatAmount(amounts.totalCents),
        now: formatAmount(amounts.nowCents),
        later: formatAmount(amounts.laterCents)
      })
    }
  ];
  if (booking.kind === 'commission')
    rows.push({ label: copy.receipt.invoice, value: invoice });

  const cta =
    onDiscord && copy.email.ctaDiscord ? copy.email.ctaDiscord : copy.email.cta;
  const { html, text } = renderEmail({
    title: copy.email.subject,
    greeting: fill(copy.email.greeting, { name: details.name }),
    paragraphs: [body],
    rows,
    button:
      cta && effects.meetLink
        ? { label: cta, href: effects.meetLink }
        : undefined,
    after: [copy.email.reply],
    signature: copy.email.signature
  });
  return {
    // No Reply-To: it comes from Candy's Gmail, so a reply goes to him.
    to: { name: details.name, address: details.email },
    subject: copy.email.subject,
    html,
    text
  };
}

/**
 * Candy's own note of a booking: who, what, when (in `candyZone`, the
 * zone of Candy's hours), and what's been done.
 */
export function candyBookingEmail(
  booking: BookingDocument,
  effects: BookingEffects,
  to: string,
  paymentLink: string,
  candyZone: string
): OutgoingEmail {
  const { details, amounts } = booking;
  const session = booking.kind === 'session';
  const rows: { label: string; value: string }[] = [
    { label: session ? '1-1 session' : 'Commission', value: booking.itemName },
    { label: 'Reference', value: booking.ref }
  ];
  if (booking.start) {
    const his = whenIn(booking.start, candyZone);
    const theirs = whenIn(booking.start, booking.visitorTimeZone);
    rows.push({
      label: 'When',
      value: `${his.date}, ${his.time} (${his.zone})`
    });
    if (theirs.zone !== his.zone)
      rows.push({
        label: 'Their time',
        value: `${theirs.date}, ${theirs.time} (${theirs.zone})`
      });
    rows.push({
      label: 'Meets on',
      value:
        details.meetOn === 'discord'
          ? 'Discord (Meet link as a fallback)'
          : 'Google Meet'
    });
  }
  rows.push(
    { label: 'Name', value: details.name },
    { label: 'Email', value: details.email }
  );
  if (details.instagram)
    rows.push({ label: 'Instagram', value: details.instagram });
  if (details.discord) rows.push({ label: 'Discord', value: details.discord });
  if (details.phone) rows.push({ label: 'Phone', value: details.phone });
  rows.push({
    label: 'Paid now',
    value: `${formatAmount(amounts.nowCents)} CAD`
  });
  if (amounts.laterCents > 0)
    rows.push({
      label: 'Still due',
      value: `${formatAmount(amounts.laterCents)} CAD, invoice ${effects.invoiceRef ?? invoiceRefFor(booking.ref)}`
    });

  const paragraphs = [
    session
      ? `${details.name} booked a session. It's on your calendar${effects.meetLink ? ', with a Google Meet link' : ''}, and they've had their confirmation.`
      : `${details.name} started a commission and paid the first half. Their receipt has the invoice for the rest, to pay on the site when you say it's ready.`
  ];
  if (details.note) paragraphs.push(`Their note: ${details.note}`);
  if (session && !effects.calendarEventId)
    paragraphs.push(
      "The calendar event couldn't be made, so there's no Meet link yet. Add the session to your calendar and send them the link."
    );

  const { html, text } = renderEmail({
    title: `New booking · ${booking.itemName}`,
    paragraphs,
    rows,
    button: effects.meetLink
      ? { label: 'Open the Meet link', href: effects.meetLink }
      : { label: 'See the payment', href: paymentLink },
    after: [
      `The payment, in Stripe: ${paymentLink}`,
      'Reply to this email to write to them.'
    ],
    signature: absolute('/services/producer')
  });
  return {
    to: { name: 'Candy Heist', address: to },
    replyTo: { name: details.name, address: details.email },
    subject: `New booking: ${booking.itemName}, ${details.name}`,
    html,
    text
  };
}

/** A session with its time. */
type Timed = BookingDocument & { start: Date };

/**
 * The client's email when Candy moves their session from Candy Haven:
 * the new time and the old, in their zone, and the call link (kept).
 */
export function clientMovedEmail(
  booking: Timed,
  previous: Date
): OutgoingEmail {
  const flow = flowCopy(producerFlowContent, 'session').confirmation;
  const copy = producerFlowContent.changes.moved;
  const was = whenIn(previous, booking.visitorTimeZone);
  const { meetLink } = booking.effects;
  const { html, text } = renderEmail({
    title: copy.subject,
    greeting: fill(flow.email.greeting, { name: booking.details.name }),
    paragraphs: [
      fill(copy.body, whenIn(booking.start, booking.visitorTimeZone))
    ],
    rows: [
      { label: flow.receipt.item, value: booking.itemName },
      { label: flow.receipt.reference, value: booking.ref },
      { label: copy.was, value: `${was.date}, ${was.time} (${was.zone})` }
    ],
    button: meetLink ? { label: copy.cta, href: meetLink } : undefined,
    after: [flow.email.reply],
    signature: flow.email.signature
  });
  return {
    to: { name: booking.details.name, address: booking.details.email },
    subject: copy.subject,
    html,
    text
  };
}

/**
 * The client's email when Candy cancels their session from Candy Haven:
 * which one, and whatever Candy wrote to go with it.
 */
export function clientCancelledEmail(
  booking: Timed,
  note: string
): OutgoingEmail {
  const flow = flowCopy(producerFlowContent, 'session').confirmation;
  const copy = producerFlowContent.changes.cancelled;
  const paragraphs = [
    fill(copy.body, whenIn(booking.start, booking.visitorTimeZone))
  ];
  if (note.trim()) paragraphs.push(note.trim());
  const { html, text } = renderEmail({
    title: copy.subject,
    greeting: fill(flow.email.greeting, { name: booking.details.name }),
    paragraphs,
    rows: [
      { label: flow.receipt.item, value: booking.itemName },
      { label: flow.receipt.reference, value: booking.ref }
    ],
    after: [flow.email.reply],
    signature: flow.email.signature
  });
  return {
    to: { name: booking.details.name, address: booking.details.email },
    subject: copy.subject,
    html,
    text
  };
}

export function clientInvoicePaidEmail(
  invoice: InvoiceDocument
): OutgoingEmail {
  const copy = invoiceCopy.paid;
  const { html, text } = renderEmail({
    title: copy.email.subject,
    greeting: fill(copy.email.greeting, { name: invoice.name }),
    paragraphs: [fill(copy.email.body, { item: invoice.itemName })],
    rows: [
      { label: copy.receipt.invoice, value: invoice.ref },
      { label: copy.receipt.paid, value: formatAmount(invoice.dueCents) }
    ],
    button: { label: 'Book again', href: absolute('/services/producer') },
    after: [copy.email.reply],
    signature: copy.email.signature
  });
  return {
    to: { name: invoice.name, address: invoice.email },
    subject: copy.email.subject,
    html,
    text
  };
}

export function candyInvoicePaidEmail(
  invoice: InvoiceDocument,
  to: string,
  paymentLink: string
): OutgoingEmail {
  const { html, text } = renderEmail({
    title: `Invoice paid · ${invoice.itemName}`,
    paragraphs: [`${invoice.name} paid the rest of their commission.`],
    rows: [
      { label: 'Invoice', value: invoice.ref },
      { label: 'Booking', value: invoice.bookingRef },
      { label: 'Paid', value: `${formatAmount(invoice.dueCents)} CAD` },
      { label: 'Name', value: invoice.name },
      { label: 'Email', value: invoice.email }
    ],
    button: { label: 'See the payment', href: paymentLink },
    after: ['Reply to this email to write to them.'],
    signature: absolute('/services/pay')
  });
  return {
    to: { name: 'Candy Heist', address: to },
    replyTo: { name: invoice.name, address: invoice.email },
    subject: `Invoice paid: ${invoice.ref}, ${invoice.name}`,
    html,
    text
  };
}
