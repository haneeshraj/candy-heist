import type { BookingConfirmation, BookingDraft } from './bookingState';

// Where a booking gets finalised. For now it only checks the draft and
// hands back a reference: taking the advance (Stripe), saving the booking
// and sending the confirmation email arrive with the Server Actions and the
// database. The flow already awaits it, so swapping it in changes nothing
// else.

export class IncompleteBookingError extends Error {
  constructor() {
    super('The booking is missing its session, date, time or details.');
    this.name = 'IncompleteBookingError';
  }
}

const reference = () =>
  `CH-${Date.now().toString(36).slice(-4)}${Math.random()
    .toString(36)
    .slice(2, 6)}`.toUpperCase();

export async function completeBooking(
  draft: BookingDraft
): Promise<BookingConfirmation> {
  const { serviceId, date, time, details, detailsDone } = draft;
  if (!serviceId || !date || !time || !detailsDone)
    throw new IncompleteBookingError();

  return {
    reference: reference(),
    serviceId,
    date,
    time,
    name: details.name.trim(),
    email: details.email.trim()
  };
}
