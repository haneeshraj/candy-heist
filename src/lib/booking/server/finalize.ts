import 'server-only';
import { getServices } from '@/content/services/getServices';
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
import { paymentDashboardLink } from '@/lib/payments/stripe';
import { forgetCalendar } from './busy';
import { sessionEventFor } from './sessionEvent';
import { candyBookingEmail, clientBookingEmail } from './emails';
import {
  markPaid,
  recordEffects,
  releaseLease,
  takeLease,
  touchBooking
} from './store';

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
    // Candy's own zone, for his calendar and his note.
    const { timeZone } = (await getServices()).hours;

    if (
      leased.kind === 'session' &&
      leased.start &&
      leased.end &&
      !effects.calendarEventId
    ) {
      const event = await placeSessionEvent(
        sessionEventFor(
          { ...leased, start: leased.start, end: leased.end },
          timeZone
        )
      );
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
          paymentDashboardLink(paymentIntentId),
          timeZone
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
  // So Haven sees the booking paid in full.
  await touchBooking(invoice.bookingRef);
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
          paymentDashboardLink(paymentIntentId)
        )
      );
      await recordInvoiceEffect(ref, 'candyEmailAt');
    }
    return leased;
  } finally {
    await releaseInvoiceLease(ref);
  }
}
