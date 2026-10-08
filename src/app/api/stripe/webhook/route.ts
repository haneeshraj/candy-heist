import {
  finalizeBooking,
  finalizeInvoice
} from '@/lib/booking/server/finalize';
import { getStripe } from '@/lib/payments/stripe';

// Stripe's word that a payment went through, as a backstop: the page
// finishes a booking itself, but if the visitor closes the tab between the
// card going through and the page finishing, this does it instead. Signed
// by Stripe (STRIPE_WEBHOOK_SECRET); anything unsigned is turned away. An
// error answers 500, so Stripe tries again later.

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) return new Response('Not configured', { status: 503 });
  const signature = request.headers.get('stripe-signature');
  if (!signature) return new Response('No signature', { status: 400 });

  const body = await request.text();
  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return new Response('Bad signature', { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const payment = event.data.object;
    const { purpose, ref } = payment.metadata ?? {};
    try {
      if (purpose === 'booking' && ref) await finalizeBooking(ref, payment.id);
      if (purpose === 'invoice' && ref) await finalizeInvoice(ref, payment.id);
    } catch (error) {
      console.error(`Stripe's word on ${ref} could not be acted on.`, error);
      return new Response('Try again', { status: 500 });
    }
  }
  return Response.json({ received: true });
}
