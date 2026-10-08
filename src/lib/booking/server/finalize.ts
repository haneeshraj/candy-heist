import 'server-only';
import type { BookingDocument } from '@/lib/db/collections';
import { placeSessionEvent } from '@/lib/google/calendar';
import { senderAddress, sendEmail } from '@/lib/google/gmail';
import { googleConnected } from '@/lib/google/oauth';
import {
  candyInvoicePaidEmail,
  clientInvoicePaidEmail
} from '@/lib/booking/server/emails';
import {
  markInvoicePaid,
  openInvoice,
  recordInvoiceEffect,
  releaseInvoiceLease,
  takeInvoiceLease
} from '@/lib/invoices/store';
import { dashboardLink } from '@/lib/payments/stripe';
import { HOURS } from '../hours';
import { forgetCalendar } from './busy';
import { candyBookingEmail, clientBookingEmail } from './emails';
import { markPaid, recordEffects, releaseLease, takeLease } from './store';

// What happens once a payment has gone through, run by whichever gets
// there first: the page finishing the payment, or Stripe's webhook. It's
// paid at once; then, under a lease, each step is done and recorded, so a
// second run picks up where the first stopped and repeats nothing. With
// Google not connected, the payment still stands, but there's no calendar
// event and no email: Candy sees it in Stripe.

/** Where Candy's own notes go: BOOKING_NOTIFY_EMAIL, else his connected Gmail. */
async function candyAddress(): Promise<string> {
  return process.env.BOOKING_NOTIFY_EMAIL?.trim() || senderAddress();
}

const paymentLink = (id: string) =>
  dashboardLink({
    id,
    livemode: (process.env.STRIPE_SECRET_KEY ?? '').startsWith('sk_live_')
  });

export async function finalizeBooking(
  ref: string,
  paymentIntentId: string
): Promise<BookingDocument | null> {
  const booking = await markPaid(ref, paymentIntentId);
  if (!booking || booking.status !== 'paid') return booking;
  forgetCalendar();

  const leased = await takeLease(ref);
  if (!leased) return booking;
  try {
    let effects = leased.effects;
    const google = await googleConnected();

    if (leased.kind === 'commission' && !effects.invoiceRef) {
      const invoice = await openInvoice(leased);
      effects = await recordEffects(ref, { invoiceRef: invoice.ref });
    }

    if (!google) {
      console.warn(
        `Booking ${ref} is paid, but Google isn't connected: no calendar event or emails.`
      );
      return { ...leased, effects };
    }

    if (
      leased.kind === 'session' &&
      leased.start &&
      leased.end &&
      !effects.calendarEventId
    ) {
      const { details } = leased;
      const event = await placeSessionEvent({
        reference: ref,
        summary: `${leased.itemName} · ${details.name}`,
        description: [
          `${leased.itemName}, booked on the site. Reference ${ref}.`,
          details.meetOn === 'discord'
            ? `They'd like to meet on Discord: ${details.discord}. The Meet link is the fallback.`
            : 'On Google Meet.',
          details.instagram ? `Instagram: ${details.instagram}` : '',
          details.phone ? `Phone: ${details.phone}` : '',
          details.note ? `Their note: ${details.note}` : ''
        ]
          .filter(Boolean)
          .join('\n'),
        start: leased.start,
        end: leased.end,
        attendee: { email: details.email, name: details.name },
        timeZone: HOURS.timeZone
      });
      effects = await recordEffects(ref, {
        calendarEventId: event.id,
        meetLink: event.meetLink
      });
    }

    if (!effects.clientEmailAt) {
      await sendEmail(clientBookingEmail(leased, effects));
      effects = await recordEffects(ref, { clientEmailAt: new Date() });
    }
    if (!effects.candyEmailAt) {
      await sendEmail(
        candyBookingEmail(
          leased,
          effects,
          await candyAddress(),
          paymentLink(paymentIntentId)
        )
      );
      effects = await recordEffects(ref, { candyEmailAt: new Date() });
    }
    return { ...leased, effects };
  } finally {
    await releaseLease(ref);
  }
}

export async function finalizeInvoice(ref: string, paymentIntentId: string) {
  const invoice = await markInvoicePaid(ref, paymentIntentId);
  if (!invoice || invoice.status !== 'paid') return invoice;
  const leased = await takeInvoiceLease(ref);
  if (!leased) return invoice;
  try {
    if (!(await googleConnected())) {
      console.warn(
        `Invoice ${ref} is paid, but Google isn't connected: no emails.`
      );
      return leased;
    }
    if (!leased.effects.clientEmailAt) {
      await sendEmail(clientInvoicePaidEmail(leased));
      await recordInvoiceEffect(ref, 'clientEmailAt');
    }
    if (!leased.effects.candyEmailAt) {
      await sendEmail(
        candyInvoicePaidEmail(
          leased,
          await candyAddress(),
          paymentLink(paymentIntentId)
        )
      );
      await recordInvoiceEffect(ref, 'candyEmailAt');
    }
    return leased;
  } finally {
    await releaseInvoiceLease(ref);
  }
}
