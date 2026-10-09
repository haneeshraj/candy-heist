import 'server-only';
import type { BookingDocument } from '@/lib/db/collections';
import type { SessionEvent } from '@/lib/google/calendar';

// A paid session as it goes on Candy's calendar: what it is and who it's
// with, how to reach them, and the client invited. Made once it's paid
// (finalize.ts), and again if it's moved before it was ever made.

export function sessionEventFor(
  booking: BookingDocument & { start: Date; end: Date },
  timeZone: string
): SessionEvent {
  const { details, ref } = booking;
  return {
    reference: ref,
    summary: `${booking.itemName} · ${details.name}`,
    description: [
      `${booking.itemName}, booked on the site. Reference ${ref}.`,
      details.meetOn === 'discord'
        ? `They'd like to meet on Discord: ${details.discord}. The Meet link is the fallback.`
        : 'On Google Meet.',
      details.instagram ? `Instagram: ${details.instagram}` : '',
      details.phone ? `Phone: ${details.phone}` : '',
      details.note ? `Their note: ${details.note}` : ''
    ]
      .filter(Boolean)
      .join('\n'),
    start: booking.start,
    end: booking.end,
    attendee: { email: details.email, name: details.name },
    timeZone
  };
}
