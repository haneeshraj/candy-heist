// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BookingDocument, BookingEffects } from '@/lib/db/collections';
import { placeSessionEvent } from '@/lib/google/calendar';
import { sendEmail } from '@/lib/google/gmail';
import { googleConnected } from '@/lib/google/oauth';
import { openInvoice } from '@/lib/invoices/store';
import { finalizeBooking } from './finalize';
import { markPaid, recordEffects, releaseLease, takeLease } from './store';

vi.mock('./store', () => ({
  markPaid: vi.fn(),
  takeLease: vi.fn(),
  releaseLease: vi.fn(),
  recordEffects: vi.fn()
}));
vi.mock('./busy', () => ({ forgetCalendar: vi.fn() }));
vi.mock('@/lib/google/calendar', () => ({ placeSessionEvent: vi.fn() }));
vi.mock('@/lib/google/gmail', () => ({
  sendEmail: vi.fn(),
  senderAddress: vi.fn(async () => 'candy@example.com')
}));
vi.mock('@/lib/google/oauth', () => ({ googleConnected: vi.fn() }));
vi.mock('@/lib/invoices/store', () => ({
  invoiceRefFor: (ref: string) => `${ref}-2`,
  openInvoice: vi.fn(async (booking: { ref: string }) => ({
    ref: `${booking.ref}-2`
  })),
  markInvoicePaid: vi.fn(),
  takeInvoiceLease: vi.fn(),
  releaseInvoiceLease: vi.fn(),
  recordInvoiceEffect: vi.fn()
}));

const session = (): BookingDocument => ({
  _id: {} as never,
  ref: 'CH-K3P2Q8',
  kind: 'session',
  itemId: 'dj-lessons',
  itemName: 'DJ Lessons',
  start: new Date('2026-10-08T17:00:00Z'),
  end: new Date('2026-10-08T18:00:00Z'),
  visitorTimeZone: 'Europe/London',
  details: {
    name: 'Alex Martin',
    email: 'alex@example.com',
    meetOn: 'meet',
    instagram: '',
    discord: '',
    phone: '',
    note: 'Bring the stems.'
  },
  amounts: { totalCents: 9000, nowCents: 9000, laterCents: 0, currency: 'cad' },
  status: 'paid',
  paymentIntentId: 'pi_1',
  createdAt: new Date(),
  effects: {}
});

let effects: BookingEffects;

describe('finalizeBooking', () => {
  beforeEach(() => {
    effects = {};
    vi.mocked(googleConnected).mockReset().mockResolvedValue(true);
    vi.mocked(markPaid)
      .mockReset()
      .mockImplementation(async () => ({ ...session(), effects }));
    vi.mocked(takeLease)
      .mockReset()
      .mockImplementation(async () => ({ ...session(), effects }));
    vi.mocked(recordEffects)
      .mockReset()
      .mockImplementation(async (_ref, done) => {
        effects = { ...effects, ...done };
        return effects;
      });
    vi.mocked(releaseLease).mockReset();
    vi.mocked(placeSessionEvent)
      .mockReset()
      .mockResolvedValue({
        id: 'ev1',
        meetLink: 'https://meet.google.com/abc-defg-hij',
        htmlLink: null
      });
    vi.mocked(sendEmail).mockReset();
    vi.mocked(openInvoice).mockClear();
  });

  it('puts a session on the calendar with Meet, then emails the client and Candy', async () => {
    await finalizeBooking('CH-K3P2Q8', 'pi_1');
    expect(placeSessionEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: 'CH-K3P2Q8',
        attendee: { email: 'alex@example.com', name: 'Alex Martin' }
      })
    );
    const [client, candy] = vi
      .mocked(sendEmail)
      .mock.calls.map(([email]) => email);
    expect(client.to.address).toBe('alex@example.com');
    // In their own time: 17:00 UTC is 18:00 in London.
    expect(client.text).toContain('Thursday 8 October, 18:00');
    expect(client.html).toContain('https://meet.google.com/abc-defg-hij');
    expect(candy.to.address).toBe('candy@example.com');
    expect(candy.replyTo?.address).toBe('alex@example.com');
    expect(candy.text).toContain('14:00 (Atlantic Time)');
    expect(effects).toMatchObject({
      calendarEventId: 'ev1',
      clientEmailAt: expect.any(Date),
      candyEmailAt: expect.any(Date)
    });
    expect(releaseLease).toHaveBeenCalledWith('CH-K3P2Q8');
  });

  it('does nothing twice', async () => {
    effects = {
      calendarEventId: 'ev1',
      meetLink: null,
      clientEmailAt: new Date(),
      candyEmailAt: new Date()
    };
    await finalizeBooking('CH-K3P2Q8', 'pi_1');
    expect(placeSessionEvent).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('leaves it to whoever holds the lease', async () => {
    vi.mocked(takeLease).mockResolvedValue(null);
    await finalizeBooking('CH-K3P2Q8', 'pi_1');
    expect(placeSessionEvent).not.toHaveBeenCalled();
    expect(releaseLease).not.toHaveBeenCalled();
  });

  it('gives a commission its invoice, and names it in the receipt', async () => {
    const commission = {
      ...session(),
      kind: 'commission' as const,
      itemName: 'Mixing',
      start: undefined,
      end: undefined
    };
    vi.mocked(markPaid).mockImplementation(async () => ({
      ...commission,
      effects
    }));
    vi.mocked(takeLease).mockImplementation(async () => ({
      ...commission,
      effects
    }));
    await finalizeBooking('CH-K3P2Q8', 'pi_1');
    expect(openInvoice).toHaveBeenCalledTimes(1);
    expect(placeSessionEvent).not.toHaveBeenCalled();
    expect(vi.mocked(sendEmail).mock.calls[0][0].text).toContain('CH-K3P2Q8-2');
  });

  it('still counts it paid with Google not connected, but sends nothing', async () => {
    vi.mocked(googleConnected).mockResolvedValue(false);
    await finalizeBooking('CH-K3P2Q8', 'pi_1');
    expect(placeSessionEvent).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(releaseLease).toHaveBeenCalled();
  });

  it('stops at a booking that isn’t paid', async () => {
    vi.mocked(markPaid).mockResolvedValue({
      ...session(),
      status: 'awaiting-payment'
    });
    await finalizeBooking('CH-K3P2Q8', 'pi_1');
    expect(takeLease).not.toHaveBeenCalled();
  });
});
