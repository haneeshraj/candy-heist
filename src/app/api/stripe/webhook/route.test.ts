// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  finalizeBooking,
  finalizeInvoice
} from '@/lib/booking/server/finalize';
import { POST } from './route';

const constructEvent = vi.hoisted(() => vi.fn());
vi.mock('@/lib/payments/stripe', () => ({
  getStripe: () => ({ webhooks: { constructEvent } })
}));
vi.mock('@/lib/booking/server/finalize', () => ({
  finalizeBooking: vi.fn(),
  finalizeInvoice: vi.fn()
}));

const post = (signature: string | null = 't=1,v1=abc') =>
  POST(
    new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      headers: signature ? { 'stripe-signature': signature } : {},
      body: '{"id":"evt_1"}'
    })
  );

const succeeded = (metadata: Record<string, string>) => ({
  type: 'payment_intent.succeeded',
  data: { object: { id: 'pi_1', metadata } }
});

describe('the Stripe webhook', () => {
  beforeEach(() => {
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test');
    constructEvent.mockReset();
    vi.mocked(finalizeBooking).mockReset();
    vi.mocked(finalizeInvoice).mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it('turns away anything Stripe didn’t sign', async () => {
    expect((await post(null)).status).toBe(400);
    constructEvent.mockImplementation(() => {
      throw new Error('No signatures found');
    });
    expect((await post()).status).toBe(400);
    expect(finalizeBooking).not.toHaveBeenCalled();
  });

  it('isn’t open without its secret', async () => {
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', '');
    expect((await post()).status).toBe(503);
  });

  it('finishes the booking or the invoice the payment was for', async () => {
    constructEvent.mockReturnValueOnce(
      succeeded({ purpose: 'booking', ref: 'CH-K3P2Q8' })
    );
    expect((await post()).status).toBe(200);
    expect(finalizeBooking).toHaveBeenCalledWith('CH-K3P2Q8', 'pi_1');

    constructEvent.mockReturnValueOnce(
      succeeded({ purpose: 'invoice', ref: 'CH-K3P2Q8-2' })
    );
    expect((await post()).status).toBe(200);
    expect(finalizeInvoice).toHaveBeenCalledWith('CH-K3P2Q8-2', 'pi_1');
  });

  it('asks Stripe to try again when the follow-up fails', async () => {
    constructEvent.mockReturnValueOnce(
      succeeded({ purpose: 'booking', ref: 'CH-K3P2Q8' })
    );
    vi.mocked(finalizeBooking).mockRejectedValueOnce(
      new Error('Gmail is down')
    );
    expect((await post()).status).toBe(500);
  });
});
