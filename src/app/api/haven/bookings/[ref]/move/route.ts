import { moveBooking } from '@/lib/booking/server/haven';
import { bookingRoute, type RefContext } from '@/lib/haven/bookingRoutes';

// POST { start, force? }: move a paid 1-1 session to a new time. Refused
// when another session is booked then, or (unless forced) Candy's calendar
// has something then. Answers with the booking, and whether the calendar
// and the client were told.

export async function POST(request: Request, context: RefContext) {
  return bookingRoute(request, context, (ref, uid, body) =>
    moveBooking(ref, body, uid)
  );
}
