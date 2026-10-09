import 'server-only';
import Stripe from 'stripe';

// Payments, through Stripe, in Canadian dollars. Card only: the card is
// typed into Stripe's own fields on the page, so this server only ever
// sees the payment, never the card.
//
//   STRIPE_SECRET_KEY                    sk_test_… in development, sk_live_… live
//   STRIPE_WEBHOOK_SECRET                whsec_…, for /api/stripe/webhook
//   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY   pk_…, read by the page (lib/payments/client.ts)

export const CURRENCY = 'cad';

export class PaymentsUnavailableError extends Error {
  constructor() {
    super('Payments are not configured: set STRIPE_SECRET_KEY.');
    this.name = 'PaymentsUnavailableError';
  }
}

const store = globalThis as typeof globalThis & {
  __candyHeistStripe?: { key: string; client: Stripe };
};

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new PaymentsUnavailableError();
  if (store.__candyHeistStripe?.key !== key)
    store.__candyHeistStripe = {
      key,
      client: new Stripe(key, { appInfo: { name: 'candy-heist' } })
    };
  return store.__candyHeistStripe.client;
}

/** What a payment is for, in its metadata, so the webhook knows. */
export type PaymentPurpose = 'booking' | 'invoice';

export interface PaymentMetadata {
  purpose: PaymentPurpose;
  /** The booking's reference, or the invoice's. */
  ref: string;
  [key: string]: string;
}

export async function createCardPayment(input: {
  amountCents: number;
  description: string;
  metadata: PaymentMetadata;
  /** The same key always makes the same payment, so a retry can't charge twice. */
  idempotencyKey: string;
}): Promise<Stripe.PaymentIntent> {
  return getStripe().paymentIntents.create(
    {
      amount: input.amountCents,
      currency: CURRENCY,
      allowed_payment_method_types: ['card'],
      description: input.description,
      metadata: input.metadata
    },
    { idempotencyKey: input.idempotencyKey }
  );
}

export const retrievePayment = (id: string) =>
  getStripe().paymentIntents.retrieve(id);

/** Where Candy finds a payment in his Stripe dashboard. */
export const dashboardLink = (payment: { id: string; livemode: boolean }) =>
  `https://dashboard.stripe.com/${payment.livemode ? '' : 'test/'}payments/${payment.id}`;

/** A payment's page in Stripe's dashboard, live or test as the keys here are. */
export const paymentDashboardLink = (id: string) =>
  dashboardLink({
    id,
    livemode: (process.env.STRIPE_SECRET_KEY ?? '').startsWith('sk_live_')
  });
