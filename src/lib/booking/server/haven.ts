import 'server-only';
import { z } from 'zod';
import { getServices } from '@/content/services/getServices';
import type {
  BookingAmounts,
  BookingDocument,
  InvoiceDocument
} from '@/lib/db/collections';
import {
  calendarBusy,
  moveSessionEvent,
  placeSessionEvent,
  removeSessionEvent
} from '@/lib/google/calendar';
import { sendEmail } from '@/lib/google/gmail';
import { googleConnected } from '@/lib/google/oauth';
import { invoicesFor } from '@/lib/invoices/store';
import { paymentDashboardLink } from '@/lib/payments/stripe';
import { clashes, withoutInterval, type Interval } from '../availability';
import type { BookingDetails, FlowKind } from '../bookingState';
import { forgetCalendar } from './busy';
import { clientCancelledEmail, clientMovedEmail } from './emails';
import { sessionEventFor } from './sessionEvent';
import {
  bookingsChangedSince,
  cancelSession,
  findBooking,
  moveSession,
  recordEffects,
  rivalSession
} from './store';

// The bookings as Candy Haven's SERVICES shows them (its PRODUCER tab):
// every paid one, with its invoice, handed over as they change; and what
// Haven can do to a session: move it to another time, or cancel it.
//
// Where each booking stands in Candy's own workflow, and any notes, stay
// in Haven. Moving or cancelling is the site's to do, because the site
// keeps the open times: a moved session frees its old time and takes its
// new one, a cancelled one frees its time, and either way Candy's
// calendar and the client hear about it, from Candy's Google account.

/** How many bookings one check-in hands over before asking for the rest. */
export const PAGE_SIZE = 200;

export interface InvoiceForHaven {
  ref: string;
  status: 'open' | 'paid';
  dueCents: number;
  paidAt: string | null;
}

export interface BookingForHaven {
  id: string;
  /** The reference people see: CH-K3P2Q8. */
  ref: string;
  kind: FlowKind;
  itemId: string;
  itemName: string;
  status: 'paid' | 'cancelled';
  /** A session's time; null for a commission. */
  start: string | null;
  end: string | null;
  /** Where the client booked from. */
  visitorTimeZone: string;
  details: BookingDetails;
  amounts: BookingAmounts;
  createdAt: string;
  paidAt: string | null;
  updatedAt: string;
  /** A session's Google Meet link, once it's on Candy's calendar. */
  meetLink: string | null;
  /** A commission's other half. */
  invoice: InvoiceForHaven | null;
  /** The payment, in Stripe's dashboard. */
  paymentUrl: string | null;
  /** Each time it was moved, oldest first. */
  moves: Array<{ from: string; to: string; at: string }>;
  cancelledAt: string | null;
  /** What Candy told the client on cancelling, if anything. */
  cancelNote: string;
}

export interface BookingChanges {
  bookings: BookingForHaven[];
  /** Pass back as `since` next time. */
  cursor: string;
  /** More changed than one page holds: ask again with the cursor. */
  more: boolean;
}

const iso = (date: Date | undefined | null) => date?.toISOString() ?? null;

function invoiceForHaven(invoice: InvoiceDocument): InvoiceForHaven {
  return {
    ref: invoice.ref,
    status: invoice.status,
    dueCents: invoice.dueCents,
    paidAt: iso(invoice.paidAt)
  };
}

export function bookingForHaven(
  booking: BookingDocument,
  invoice?: InvoiceDocument | null
): BookingForHaven {
  return {
    id: booking._id.toHexString(),
    ref: booking.ref,
    kind: booking.kind,
    itemId: booking.itemId,
    itemName: booking.itemName,
    status: booking.status === 'cancelled' ? 'cancelled' : 'paid',
    start: iso(booking.start),
    end: iso(booking.end),
    visitorTimeZone: booking.visitorTimeZone,
    details: booking.details,
    amounts: booking.amounts,
    createdAt: booking.createdAt.toISOString(),
    paidAt: iso(booking.paidAt),
    updatedAt: booking.updatedAt.toISOString(),
    meetLink: booking.effects.meetLink ?? null,
    invoice: invoice ? invoiceForHaven(invoice) : null,
    paymentUrl: booking.paymentIntentId
      ? paymentDashboardLink(booking.paymentIntentId)
      : null,
    moves: (booking.moves ?? []).map((move) => ({
      from: move.from.toISOString(),
      to: move.to.toISOString(),
      at: move.at.toISOString()
    })),
    cancelledAt: iso(booking.cancelledAt),
    cancelNote: booking.cancelNote ?? ''
  };
}

/**
 * Every paid or cancelled booking changed at or after `since`, oldest
 * change first, each with its invoice. A full page ends somewhere inside
 * the changes, so the cursor stops at its last one and the next ask
 * starts there.
 */
export async function bookingChangesSince(
  since: Date
): Promise<BookingChanges> {
  const page = await bookingsChangedSince(since, PAGE_SIZE);
  const invoices = await invoicesFor(
    page.filter((booking) => booking.kind === 'commission').map((b) => b.ref)
  );
  const byBooking = new Map(invoices.map((inv) => [inv.bookingRef, inv]));
  const last = page[page.length - 1];
  return {
    bookings: page.map((booking) =>
      bookingForHaven(booking, byBooking.get(booking.ref))
    ),
    cursor: (last?.updatedAt ?? since).toISOString(),
    more: page.length === PAGE_SIZE
  };
}

// ---------------------------------------------------- moving, cancelling

export interface BookingActionResult {
  booking: BookingForHaven;
  /** What happened on Candy's calendar. */
  calendar: 'updated' | 'removed' | 'not-connected' | 'failed';
  /** Whether the client heard about it. */
  email: 'sent' | 'not-connected' | 'failed';
}

export type BookingActionOutcome =
  | { ok: true; body: BookingActionResult }
  | { ok: false; status: 400 | 404 | 409; body: Record<string, unknown> };

const fail = (
  status: 400 | 404 | 409,
  body: Record<string, unknown>
): BookingActionOutcome => ({ ok: false, status, body });
const invalid = (message: string) => fail(400, { error: 'invalid', message });
const notFound = () => fail(404, { error: 'not_found' });
const outOfDate = () =>
  fail(409, {
    error: 'out_of_date',
    message:
      'That session changed on the other computer. Check for new, then try again.'
  });

const moveSchema = z.object({
  /** The new start, as an ISO instant. */
  start: z.string().max(40),
  /** Move it even though Candy's calendar has something then. */
  force: z.boolean().default(false)
});

const cancelSchema = z.object({
  /** What Candy wants the client told, if anything. */
  note: z.string().trim().max(1000).default('')
});

/** A paid session Haven can act on, or why not. */
async function sessionToChange(
  ref: string
): Promise<
  | { ok: true; booking: BookingDocument & { start: Date; end: Date } }
  | { ok: false; outcome: BookingActionOutcome }
> {
  const booking = await findBooking(ref);
  if (!booking || booking.status === 'awaiting-payment')
    return { ok: false, outcome: notFound() };
  if (booking.kind !== 'session' || !booking.start || !booking.end)
    return {
      ok: false,
      outcome: invalid('Only a 1-1 session has a time to change.')
    };
  if (booking.status === 'cancelled')
    return {
      ok: false,
      outcome: fail(409, {
        error: 'cancelled',
        message: 'That session is cancelled already.'
      })
    };
  return {
    ok: true,
    booking: { ...booking, start: booking.start, end: booking.end }
  };
}

/** Busy on Candy's calendar in [start, end) and the break either side, apart from `own`. */
async function calendarClash(
  start: Date,
  end: Date,
  own: Interval,
  bufferMinutes: number
): Promise<boolean> {
  const gap = bufferMinutes * 60_000;
  const busy = await calendarBusy(
    new Date(start.getTime() - gap),
    new Date(end.getTime() + gap)
  );
  return clashes(start, end, withoutInterval(busy, own), bufferMinutes);
}

/**
 * Moves a session to a new time, the same length: refused when another
 * session is booked then (always), or Candy's calendar has something then
 * (unless Haven says to move it anyway). Then its calendar event moves,
 * which tells the client through Google too, and they get an email with
 * the new time and the old.
 */
export async function moveBooking(
  ref: string,
  raw: unknown,
  uid: string,
  now = new Date()
): Promise<BookingActionOutcome> {
  const parsed = moveSchema.safeParse(raw);
  const start = new Date(parsed.success ? parsed.data.start : '');
  if (!parsed.success || Number.isNaN(start.getTime()))
    return invalid('That time could not be read.');

  const found = await sessionToChange(ref);
  if (!found.ok) return found.outcome;
  const { booking } = found;
  if (start.getTime() <= now.getTime())
    return invalid('Pick a time that’s still to come.');
  if (start.getTime() === booking.start.getTime())
    return invalid('The session is at that time already.');
  const end = new Date(
    start.getTime() + (booking.end.getTime() - booking.start.getTime())
  );

  const { hours } = await getServices();
  if (await rivalSession(ref, start, end, hours.bufferMinutes, now))
    return fail(409, {
      error: 'taken',
      message: 'Another session is booked then.'
    });

  const google = await googleConnected();
  if (google && !parsed.data.force) {
    let busy = true;
    try {
      busy = await calendarClash(
        start,
        end,
        { start: booking.start, end: booking.end },
        hours.bufferMinutes
      );
    } catch (error) {
      console.error(
        `Candy's calendar could not be read to move ${ref}.`,
        error
      );
      return fail(409, {
        error: 'busy',
        message: 'Your calendar couldn’t be checked for that time.'
      });
    }
    if (busy)
      return fail(409, {
        error: 'busy',
        message: 'Your calendar has something else on then.'
      });
  }

  const moved = await moveSession(ref, booking.start, { start, end }, uid, now);
  if (!moved) return outOfDate();
  forgetCalendar();
  if (!google)
    return {
      ok: true,
      body: {
        booking: bookingForHaven(moved),
        calendar: 'not-connected',
        email: 'not-connected'
      }
    };

  let settled = moved;
  let calendar: BookingActionResult['calendar'] = 'failed';
  try {
    const event =
      (moved.effects.calendarEventId &&
        (await moveSessionEvent(
          moved.effects.calendarEventId,
          start,
          end,
          hours.timeZone
        ))) ||
      (await placeSessionEvent(
        sessionEventFor({ ...moved, start, end }, hours.timeZone)
      ));
    const effects = await recordEffects(ref, {
      calendarEventId: event.id,
      meetLink: event.meetLink ?? moved.effects.meetLink ?? null
    });
    settled = { ...moved, effects };
    calendar = 'updated';
  } catch (error) {
    console.error(
      `Session ${ref} moved, but its calendar event didn't.`,
      error
    );
  }

  let email: BookingActionResult['email'] = 'failed';
  try {
    await sendEmail(clientMovedEmail({ ...settled, start }, booking.start));
    email = 'sent';
  } catch (error) {
    console.error(
      `Session ${ref} moved, but the client wasn't emailed.`,
      error
    );
  }
  return {
    ok: true,
    body: { booking: bookingForHaven(settled), calendar, email }
  };
}

/**
 * Cancels a session still to come: its time opens up again, its event
 * comes off Candy's calendar (Google tells the client), and the client
 * gets an email saying so, with whatever Candy wrote. Any refund is
 * Candy's to make in Stripe.
 */
export async function cancelBooking(
  ref: string,
  raw: unknown,
  uid: string,
  now = new Date()
): Promise<BookingActionOutcome> {
  const parsed = cancelSchema.safeParse(raw ?? {});
  if (!parsed.success)
    return invalid('A note to the client is up to 1000 characters.');

  const found = await sessionToChange(ref);
  if (!found.ok) return found.outcome;
  const { booking } = found;
  if (booking.start.getTime() <= now.getTime())
    return invalid(
      'That session’s time has passed, so there’s nothing to cancel.'
    );

  const cancelled = await cancelSession(ref, uid, parsed.data.note, now);
  if (!cancelled) return outOfDate();
  forgetCalendar();
  if (!(await googleConnected()))
    return {
      ok: true,
      body: {
        booking: bookingForHaven(cancelled),
        calendar: 'not-connected',
        email: 'not-connected'
      }
    };

  let calendar: BookingActionResult['calendar'] = 'removed';
  if (cancelled.effects.calendarEventId)
    try {
      await removeSessionEvent(cancelled.effects.calendarEventId);
    } catch (error) {
      console.error(
        `Session ${ref} cancelled, but its calendar event is still there.`,
        error
      );
      calendar = 'failed';
    }

  let email: BookingActionResult['email'] = 'failed';
  try {
    await sendEmail(
      clientCancelledEmail(
        { ...cancelled, start: booking.start },
        parsed.data.note
      )
    );
    email = 'sent';
  } catch (error) {
    console.error(
      `Session ${ref} cancelled, but the client wasn't emailed.`,
      error
    );
  }
  return {
    ok: true,
    body: { booking: bookingForHaven(cancelled), calendar, email }
  };
}
