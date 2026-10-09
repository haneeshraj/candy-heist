// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { withinHourlyLimit } from '@/lib/forms/limits';
import { createCardPayment, retrievePayment } from '@/lib/payments/stripe';
import { finishBookingPayment, startBookingPayment } from './actions';
import { fileHours } from '@/content/services/hours';
import { offeredStarts } from './hours';
import { busyBetween } from './server/busy';
import { finalizeBooking } from './server/finalize';
import {
  dropUnpaid,
  fileBooking,
  findBooking,
  keepsItsTime,
  setPayment
} from './server/store';

vi.mock('@/lib/forms/limits', () => ({ withinHourlyLimit: vi.fn() }));
vi.mock('./server/store', () => ({
  fileBooking: vi.fn(),
  findBooking: vi.fn(),
  dropUnpaid: vi.fn(),
  keepsItsTime: vi.fn(),
  setPayment: vi.fn()
}));
vi.mock('./server/busy', () => ({
  busyBetween: vi.fn(),
  AvailabilityUnavailableError: class extends Error {}
}));
vi.mock('./server/finalize', () => ({ finalizeBooking: vi.fn() }));
vi.mock('@/lib/invoices/store', () => ({
  invoiceRefFor: (ref: string) => `${ref}-2`
}));
vi.mock('@/lib/payments/stripe', () => ({
  createCardPayment: vi.fn(),
  retrievePayment: vi.fn(),
  getStripe: vi.fn(),
  PaymentsUnavailableError: class extends Error {}
}));
vi.mock('@/content/services/getServices', async () => {
  const { fileHours } = await import('@/content/services/hours');
  return {
    getServices: vi.fn(async () => ({
      items: [
        { id: 'mixing', kind: 'commission', name: 'Mixing', price: 120.01 },
        {
          id: 'dj-lessons',
          kind: 'session',
          name: 'DJ Lessons',
          price: 90,
          durationMinutes: 60
        },
        { id: 'beats', kind: 'commission', name: 'Beats' }
      ],
      hours: fileHours
    }))
  };
});

const details = {
  name: ' Alex Martin ',
  email: 'alex@example.com',
  meetOn: 'meet' as const,
  instagram: '',
  discord: '',
  phone: '',
  note: ''
};
const input = (overrides = {}) => ({
  itemId: 'mixing',
  start: null,
  timeZone: 'Europe/London',
  details,
  ...overrides
});
// One of Candy's times, a few days on.
const aStart = () =>
  offeredStarts(
    fileHours,
    new Date(Date.now() + 3 * 86_400_000),
    new Date(Date.now() + 14 * 86_400_000)
  )[0];

describe('startBookingPayment', () => {
  beforeEach(() => {
    vi.mocked(withinHourlyLimit).mockReset().mockResolvedValue(true);
    vi.mocked(busyBetween).mockReset().mockResolvedValue([]);
    vi.mocked(keepsItsTime).mockReset().mockResolvedValue(true);
    vi.mocked(fileBooking)
      .mockReset()
      .mockImplementation(async (fields) => ({
        ...fields,
        _id: {} as never,
        ref: 'CH-K3P2Q8',
        status: 'awaiting-payment',
        createdAt: new Date(),
        updatedAt: new Date(),
        effects: {}
      }));
    vi.mocked(createCardPayment)
      .mockReset()
      .mockResolvedValue({ id: 'pi_1', client_secret: 'pi_1_secret' } as never);
    vi.mocked(dropUnpaid).mockReset();
    vi.mocked(setPayment).mockReset();
  });

  it('opens a payment for half a commission, the odd cent upfront', async () => {
    await expect(startBookingPayment(input())).resolves.toEqual({
      ok: true,
      ref: 'CH-K3P2Q8',
      clientSecret: 'pi_1_secret'
    });
    expect(vi.mocked(fileBooking).mock.calls[0][0]).toMatchObject({
      kind: 'commission',
      details: { name: 'Alex Martin' },
      amounts: { totalCents: 12001, nowCents: 6001, laterCents: 6000 }
    });
    expect(vi.mocked(createCardPayment).mock.calls[0][0]).toMatchObject({
      amountCents: 6001,
      metadata: { purpose: 'booking', ref: 'CH-K3P2Q8' },
      idempotencyKey: 'booking-CH-K3P2Q8'
    });
    expect(setPayment).toHaveBeenCalledWith('CH-K3P2Q8', 'pi_1');
  });

  it('refuses what isn’t a booking, or isn’t priced yet', async () => {
    await expect(
      startBookingPayment(input({ itemId: 'nope' }))
    ).resolves.toEqual({ ok: false, reason: 'invalid' });
    await expect(
      startBookingPayment(input({ details: { ...details, email: 'not mail' } }))
    ).resolves.toEqual({ ok: false, reason: 'invalid' });
    await expect(
      startBookingPayment(input({ timeZone: 'Mars/Olympus' }))
    ).resolves.toEqual({ ok: false, reason: 'invalid' });
    await expect(startBookingPayment({} as never)).resolves.toEqual({
      ok: false,
      reason: 'invalid'
    });
    await expect(
      startBookingPayment(input({ itemId: 'beats' }))
    ).resolves.toEqual({ ok: false, reason: 'unpriced' });
    expect(fileBooking).not.toHaveBeenCalled();
  });

  it('holds a session’s time, and refuses one that’s taken', async () => {
    const start = aStart();
    const session = input({ itemId: 'dj-lessons', start: start.toISOString() });
    await expect(startBookingPayment(session)).resolves.toMatchObject({
      ok: true
    });
    const filed = vi.mocked(fileBooking).mock.calls[0][0];
    expect(filed.start).toEqual(start);
    expect(filed.end).toEqual(new Date(start.getTime() + 60 * 60_000));
    expect(filed.holdUntil!.getTime()).toBeGreaterThan(Date.now());

    vi.mocked(busyBetween).mockResolvedValue([
      { start, end: new Date(start.getTime() + 30 * 60_000) }
    ]);
    await expect(startBookingPayment(session)).resolves.toEqual({
      ok: false,
      reason: 'taken'
    });

    // Not one of Candy's times at all.
    await expect(
      startBookingPayment({
        ...session,
        start: new Date(start.getTime() + 7 * 60_000).toISOString()
      })
    ).resolves.toEqual({ ok: false, reason: 'taken' });
  });

  it('gives way when someone else held the time a moment sooner', async () => {
    vi.mocked(keepsItsTime).mockResolvedValue(false);
    const session = input({
      itemId: 'dj-lessons',
      start: aStart().toISOString()
    });
    await expect(startBookingPayment(session)).resolves.toEqual({
      ok: false,
      reason: 'taken'
    });
    expect(dropUnpaid).toHaveBeenCalledWith('CH-K3P2Q8');
    expect(createCardPayment).not.toHaveBeenCalled();
  });

  it('holds back a visitor past the hourly limit', async () => {
    vi.mocked(withinHourlyLimit).mockResolvedValue(false);
    await expect(startBookingPayment(input())).resolves.toEqual({
      ok: false,
      reason: 'limited'
    });
  });
});

describe('finishBookingPayment', () => {
  const booking = {
    ref: 'CH-K3P2Q8',
    itemId: 'mixing',
    kind: 'commission',
    visitorTimeZone: 'Europe/London',
    details: { ...details, name: 'Alex Martin' },
    paymentIntentId: 'pi_1',
    effects: {}
  };

  beforeEach(() => {
    vi.mocked(findBooking)
      .mockReset()
      .mockResolvedValue(booking as never);
    vi.mocked(finalizeBooking)
      .mockReset()
      .mockResolvedValue(booking as never);
  });

  it('books it once Stripe says it’s paid', async () => {
    vi.mocked(retrievePayment).mockResolvedValue({
      id: 'pi_1',
      client_secret: 'pi_1_secret',
      status: 'succeeded'
    } as never);
    await expect(
      finishBookingPayment('CH-K3P2Q8', 'pi_1_secret')
    ).resolves.toEqual({
      ok: true,
      confirmation: expect.objectContaining({
        reference: 'CH-K3P2Q8',
        start: null,
        invoiceRef: 'CH-K3P2Q8-2',
        timeZone: 'Europe/London'
      })
    });
    expect(finalizeBooking).toHaveBeenCalledWith('CH-K3P2Q8', 'pi_1');
  });

  it('won’t without the payment’s own secret, or before it’s paid', async () => {
    vi.mocked(retrievePayment).mockResolvedValue({
      id: 'pi_1',
      client_secret: 'pi_1_secret',
      status: 'requires_payment_method'
    } as never);
    await expect(finishBookingPayment('CH-K3P2Q8', 'guess')).resolves.toEqual({
      ok: false,
      reason: 'unknown'
    });
    await expect(
      finishBookingPayment('CH-K3P2Q8', 'pi_1_secret')
    ).resolves.toEqual({ ok: false, reason: 'unpaid' });
    expect(finalizeBooking).not.toHaveBeenCalled();
  });
});
