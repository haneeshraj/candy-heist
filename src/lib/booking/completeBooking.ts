import type {
  BookingConfirmation,
  BookingDraft,
  FlowKind
} from './bookingState';

// Where a booking gets finalised. For now it only checks the draft and
// hands back a reference: taking the payment (Stripe), saving the booking,
// making the session's Google Meet link (always, even when Discord is
// picked, so there's a way in if the Discord details are wrong) and
// sending the confirmation email arrive with the Server Actions and the
// database. The flow already awaits it, so swapping it in changes nothing
// else.

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
  kind: FlowKind
): Promise<BookingConfirmation> {
  const { itemId, date, time, details, detailsDone } = draft;
  const timed = kind === 'commission' || (date && time);
  if (!itemId || !detailsDone || !timed) throw new IncompleteBookingError();

  return {
    reference: reference(),
    itemId,
    date: kind === 'session' ? date : null,
    time: kind === 'session' ? time : null,
    meetOn: kind === 'session' ? details.meetOn : 'meet',
    name: details.name.trim(),
    email: details.email.trim()
  };
}
