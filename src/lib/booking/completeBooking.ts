import type {
  BookingConfirmation,
  BookingDraft,
  FlowKind
} from './bookingState';

// Where a booking gets finalised. For now it only checks the draft and
// hands back a reference: taking the payment (Stripe: half of a
// commission's price, all of a session's), saving the booking, making the
// session's Google Meet link (always, even when Discord is picked, so
// there's a way in if the Discord details are wrong) and sending the
// confirmation email arrive with the Server Actions and the database. The
// flow already awaits it, so swapping it in changes nothing else.

export class IncompleteBookingError extends Error {
  constructor() {
    super('The booking is missing its item, date, time or details.');
    this.name = 'IncompleteBookingError';
  }
}

const reference = () =>
  `CH-${Date.now().toString(36).slice(-4)}${Math.random()
    .toString(36)
    .slice(2, 6)}`.toUpperCase();

export async function completeBooking(
  draft: BookingDraft,
  kind: FlowKind | undefined
): Promise<BookingConfirmation> {
  const { itemId, date, time, details, detailsDone } = draft;
  const session = kind === 'session';
  const timed = kind === 'commission' || (session && date && time);
  if (!itemId || !kind || !detailsDone || !timed)
    throw new IncompleteBookingError();

  return {
    reference: reference(),
    itemId,
    kind,
    date: session ? date : null,
    time: session ? time : null,
    meetOn: session ? details.meetOn : 'meet',
    name: details.name.trim(),
    email: details.email.trim()
  };
}
