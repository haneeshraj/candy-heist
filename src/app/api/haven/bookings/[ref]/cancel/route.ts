import { cancelBooking } from '@/lib/booking/server/haven';
import { bookingRoute, type RefContext } from '@/lib/haven/bookingRoutes';

// POST { note? }: cancel a paid 1-1 session still to come. Its time opens
// up again, it comes off Candy's calendar, and the client is told, with
// the note. Any refund is Candy's to make in Stripe.

export async function POST(request: Request, context: RefContext) {
  return bookingRoute(request, context, (ref, uid, body) =>
    cancelBooking(ref, body, uid)
  );
}
