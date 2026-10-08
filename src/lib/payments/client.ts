import { loadStripe, type Stripe } from '@stripe/stripe-js';

// Stripe.js, for the card fields on the page. Loaded once, the first time
// a payment panel shows; null while the publishable key isn't set, and the
// panel says payments aren't open yet.

let stripe: Promise<Stripe | null> | null = null;

export const publishableKey = () =>
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || null;

export function getStripeJs(): Promise<Stripe | null> | null {
  const key = publishableKey();
  if (!key) return null;
  stripe ??= loadStripe(key);
  return stripe;
}

/** What the payment panel hands back when Pay is pressed. */
export interface CardPayer {
  /**
   * Confirms a payment Stripe holds open (its client secret) with the card
   * on the panel, through 3-D Secure if the bank asks. Says why if it didn't
   * go through: the bank's or Stripe's own words.
   */
  confirm(
    clientSecret: string,
    /** The name is the panel's own field; the rest comes from the caller. */
    billing: { email?: string }
  ): Promise<{ ok: true } | { ok: false; message: string | null }>;
}
