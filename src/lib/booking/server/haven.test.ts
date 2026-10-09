// @vitest-environment node
import { ObjectId } from 'mongodb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BookingDocument, InvoiceDocument } from '@/lib/db/collections';
import {
  calendarBusy,
  moveSessionEvent,
  placeSessionEvent,
  removeSessionEvent
} from '@/lib/google/calendar';
import { sendEmail } from '@/lib/google/gmail';
import { googleConnected } from '@/lib/google/oauth';
import { invoicesFor } from '@/lib/invoices/store';
import {
  bookingChangesSince,
  cancelBooking,
  moveBooking,
  PAGE_SIZE
} from './haven';
import {
  bookingsChangedSince,
  cancelSession,
  findBooking,
  moveSession,
  recordEffects,
  rivalSession
} from './store';

// What Candy Haven sees of the bookings, and moving or cancelling a
// session from it, with the database and Google stood in for.

vi.mock('./store', () => ({
  bookingsChangedSince: vi.fn(),
  cancelSession: vi.fn(),
  findBooking: vi.fn(),
  moveSession: vi.fn(),
  recordEffects: vi.fn(),
  rivalSession: vi.fn()
}));
vi.mock('./busy', () => ({ forgetCalendar: vi.fn() }));
vi.mock('@/lib/invoices/store', () => ({
  invoicesFor: vi.fn(),
  invoiceRefFor: (ref: string) => `${ref}-2`
}));
vi.mock('@/lib/google/calendar', () => ({
  calendarBusy: vi.fn(),
  moveSessionEvent: vi.fn(),
  placeSessionEvent: vi.fn(),
  removeSessionEvent: vi.fn()
}));
vi.mock('@/lib/google/gmail', () => ({ sendEmail: vi.fn() }));
vi.mock('@/lib/google/oauth', () => ({ googleConnected: vi.fn() }));
vi.mock('@/content/services/getServices', () => ({
  getServices: vi.fn(async () => ({
    items: [],
    hours: { timeZone: 'America/Halifax', bufferMinutes: 0 }
  }))
}));

const NOW = new Date('2027-03-01T12:00:00Z');
const at = (iso: string) => new Date(iso);

const session = (patch: Partial<BookingDocument> = {}): BookingDocument => ({
  _id: new ObjectId(),
  ref: 'CH-K3P2Q8',
  kind: 'session',
  itemId: 'dj-lessons',
  itemName: 'DJ Lessons',
  start: at('2027-03-02T15:00:00Z'),
  end: at('2027-03-02T16:00:00Z'),
  visitorTimeZone: 'Europe/London',
  details: {
    name: 'Alex Martin',
    email: 'alex@example.com',
    meetOn: 'meet',
    instagram: '',
    discord: '',
    phone: '',
    note: ''
  },
  amounts: { totalCents: 9000, nowCents: 9000, laterCents: 0, currency: 'cad' },
  status: 'paid',
  paymentIntentId: 'pi_1',
  createdAt: at('2027-02-20T10:00:00Z'),
  paidAt: at('2027-02-20T10:01:00Z'),
  updatedAt: at('2027-02-20T10:02:00Z'),
  effects: { calendarEventId: 'ch-event', meetLink: 'https://meet.test/x' },
  ...patch
});

const sentTo = () => vi.mocked(sendEmail).mock.calls[0]?.[0];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(googleConnected).mockResolvedValue(true);
  vi.mocked(rivalSession).mockResolvedValue(null);
  vi.mocked(calendarBusy).mockResolvedValue([]);
  vi.mocked(recordEffects).mockImplementation(async (_ref, done) => ({
    calendarEventId: 'ch-event',
    ...done
  }));
});

describe('what Haven sees', () => {
  it('hands over each booking with its invoice, and where to start next time', async () => {
    const commission = session({
      ref: 'CH-COMM22',
      kind: 'commission',
      start: undefined,
      end: undefined,
      updatedAt: at('2027-02-21T09:00:00Z')
    });
    vi.mocked(bookingsChangedSince).mockResolvedValue([session(), commission]);
    vi.mocked(invoicesFor).mockResolvedValue([
      {
        ref: 'CH-COMM22-2',
        bookingRef: 'CH-COMM22',
        status: 'open',
        dueCents: 4500
      } as InvoiceDocument
    ]);
    const changes = await bookingChangesSince(at('2027-02-01T00:00:00Z'));
    expect(invoicesFor).toHaveBeenCalledWith(['CH-COMM22']);
    expect(changes.cursor).toBe('2027-02-21T09:00:00.000Z');
    expect(changes.more).toBe(false);
    expect(changes.bookings[0]).toMatchObject({
      ref: 'CH-K3P2Q8',
      status: 'paid',
      start: '2027-03-02T15:00:00.000Z',
      meetLink: 'https://meet.test/x',
      invoice: null,
      paymentUrl: 'https://dashboard.stripe.com/test/payments/pi_1'
    });
    expect(changes.bookings[1].invoice).toEqual({
      ref: 'CH-COMM22-2',
      status: 'open',
      dueCents: 4500,
      paidAt: null
    });
  });

  it('says there’s more when a page is full, and keeps the cursor when nothing changed', async () => {
    vi.mocked(invoicesFor).mockResolvedValue([]);
    vi.mocked(bookingsChangedSince).mockResolvedValue(
      Array.from({ length: PAGE_SIZE }, () => session())
    );
    expect((await bookingChangesSince(NOW)).more).toBe(true);
    vi.mocked(bookingsChangedSince).mockResolvedValue([]);
    expect(await bookingChangesSince(NOW)).toEqual({
      bookings: [],
      cursor: NOW.toISOString(),
      more: false
    });
  });
});

describe('moving a session', () => {
  const to = '2027-03-04T18:00:00.000Z';
  const movedTo = () =>
    session({ start: at(to), end: at('2027-03-04T19:00:00Z') });

  it('moves it, its event and tells the client, keeping its length', async () => {
    vi.mocked(findBooking).mockResolvedValue(session());
    vi.mocked(moveSession).mockResolvedValue(movedTo());
    vi.mocked(moveSessionEvent).mockResolvedValue({
      id: 'ch-event',
      meetLink: 'https://meet.test/x',
      htmlLink: null
    });
    const outcome = await moveBooking('CH-K3P2Q8', { start: to }, 'candy', NOW);
    expect(outcome).toMatchObject({
      ok: true,
      body: { calendar: 'updated', email: 'sent', booking: { start: to } }
    });
    expect(moveSession).toHaveBeenCalledWith(
      'CH-K3P2Q8',
      at('2027-03-02T15:00:00Z'),
      { start: at(to), end: at('2027-03-04T19:00:00Z') },
      'candy',
      NOW
    );
    expect(moveSessionEvent).toHaveBeenCalledWith(
      'ch-event',
      at(to),
      at('2027-03-04T19:00:00Z'),
      'America/Halifax'
    );
    const email = sentTo();
    expect(email?.to.address).toBe('alex@example.com');
    expect(email?.subject).toBe('Your session has moved');
    // In their own time, the new and the old.
    expect(email?.text).toContain('Thursday 4 March, 18:00');
    expect(email?.text).toContain('Tuesday 2 March, 15:00');
  });

  it('makes the event when it was never made', async () => {
    vi.mocked(findBooking).mockResolvedValue(session({ effects: {} }));
    vi.mocked(moveSession).mockResolvedValue({ ...movedTo(), effects: {} });
    vi.mocked(placeSessionEvent).mockResolvedValue({
      id: 'ch-new',
      meetLink: 'https://meet.test/new',
      htmlLink: null
    });
    const outcome = await moveBooking('CH-K3P2Q8', { start: to }, 'candy', NOW);
    expect(moveSessionEvent).not.toHaveBeenCalled();
    expect(placeSessionEvent).toHaveBeenCalled();
    expect(recordEffects).toHaveBeenCalledWith('CH-K3P2Q8', {
      calendarEventId: 'ch-new',
      meetLink: 'https://meet.test/new'
    });
    expect(outcome.ok && outcome.body.calendar).toBe('updated');
  });

  it('never moves it onto another session', async () => {
    vi.mocked(findBooking).mockResolvedValue(session());
    vi.mocked(rivalSession).mockResolvedValue(session({ ref: 'CH-OTHER2' }));
    expect(
      await moveBooking('CH-K3P2Q8', { start: to, force: true }, 'c', NOW)
    ).toMatchObject({ ok: false, status: 409, body: { error: 'taken' } });
    expect(moveSession).not.toHaveBeenCalled();
  });

  it('asks before moving it onto something on Candy’s calendar, not its own event', async () => {
    vi.mocked(findBooking).mockResolvedValue(session());
    // Busy only with the session itself: not a clash.
    vi.mocked(calendarBusy).mockResolvedValue([
      { start: at('2027-03-02T15:00:00Z'), end: at('2027-03-02T16:00:00Z') }
    ]);
    vi.mocked(moveSession).mockResolvedValue(
      session({
        start: at('2027-03-02T15:30:00Z'),
        end: at('2027-03-02T16:30:00Z')
      })
    );
    vi.mocked(moveSessionEvent).mockResolvedValue({
      id: 'ch-event',
      meetLink: null,
      htmlLink: null
    });
    expect(
      (
        await moveBooking(
          'CH-K3P2Q8',
          { start: '2027-03-02T15:30:00Z' },
          'c',
          NOW
        )
      ).ok
    ).toBe(true);

    // Something else then: asked, unless told to anyway.
    vi.mocked(calendarBusy).mockResolvedValue([
      { start: at('2027-03-04T17:30:00Z'), end: at('2027-03-04T18:30:00Z') }
    ]);
    expect(
      await moveBooking('CH-K3P2Q8', { start: to }, 'c', NOW)
    ).toMatchObject({ ok: false, status: 409, body: { error: 'busy' } });
    vi.mocked(moveSession).mockResolvedValue(movedTo());
    expect(
      (await moveBooking('CH-K3P2Q8', { start: to, force: true }, 'c', NOW)).ok
    ).toBe(true);
  });

  it('still moves it without Google, and says nobody was told', async () => {
    vi.mocked(googleConnected).mockResolvedValue(false);
    vi.mocked(findBooking).mockResolvedValue(session());
    vi.mocked(moveSession).mockResolvedValue(movedTo());
    expect(
      await moveBooking('CH-K3P2Q8', { start: to }, 'c', NOW)
    ).toMatchObject({
      ok: true,
      body: { calendar: 'not-connected', email: 'not-connected' }
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('keeps the move when the calendar trips, and says so', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(findBooking).mockResolvedValue(session());
    vi.mocked(moveSession).mockResolvedValue(movedTo());
    vi.mocked(moveSessionEvent).mockRejectedValue(new Error('Google 500'));
    expect(
      await moveBooking('CH-K3P2Q8', { start: to }, 'c', NOW)
    ).toMatchObject({ ok: true, body: { calendar: 'failed', email: 'sent' } });
  });

  it('refuses what isn’t a session still paid for, or a time that isn’t to come', async () => {
    vi.mocked(findBooking).mockResolvedValue(null);
    expect(
      await moveBooking('CH-K3P2Q8', { start: to }, 'c', NOW)
    ).toMatchObject({ ok: false, status: 404 });
    vi.mocked(findBooking).mockResolvedValue(
      session({ kind: 'commission', start: undefined, end: undefined })
    );
    expect(
      await moveBooking('CH-K3P2Q8', { start: to }, 'c', NOW)
    ).toMatchObject({ ok: false, status: 400 });
    vi.mocked(findBooking).mockResolvedValue(session({ status: 'cancelled' }));
    expect(
      await moveBooking('CH-K3P2Q8', { start: to }, 'c', NOW)
    ).toMatchObject({ ok: false, status: 409, body: { error: 'cancelled' } });
    vi.mocked(findBooking).mockResolvedValue(session());
    expect(
      await moveBooking(
        'CH-K3P2Q8',
        { start: '2027-02-28T10:00:00Z' },
        'c',
        NOW
      )
    ).toMatchObject({ ok: false, status: 400 });
    expect(
      await moveBooking('CH-K3P2Q8', { start: 'soon' }, 'c', NOW)
    ).toMatchObject({ ok: false, status: 400 });
  });

  it('says when it changed on the other computer meanwhile', async () => {
    vi.mocked(findBooking).mockResolvedValue(session());
    vi.mocked(moveSession).mockResolvedValue(null);
    expect(
      await moveBooking('CH-K3P2Q8', { start: to }, 'c', NOW)
    ).toMatchObject({ ok: false, status: 409, body: { error: 'out_of_date' } });
  });
});

describe('cancelling a session', () => {
  it('frees it, takes its event off the calendar and tells the client, with the note', async () => {
    vi.mocked(findBooking).mockResolvedValue(session());
    vi.mocked(cancelSession).mockResolvedValue(
      session({ status: 'cancelled', cancelNote: 'I’m ill, sorry.' })
    );
    const outcome = await cancelBooking(
      'CH-K3P2Q8',
      { note: ' I’m ill, sorry. ' },
      'candy',
      NOW
    );
    expect(outcome).toMatchObject({
      ok: true,
      body: {
        calendar: 'removed',
        email: 'sent',
        booking: { status: 'cancelled', cancelNote: 'I’m ill, sorry.' }
      }
    });
    expect(cancelSession).toHaveBeenCalledWith(
      'CH-K3P2Q8',
      'candy',
      'I’m ill, sorry.',
      NOW
    );
    expect(removeSessionEvent).toHaveBeenCalledWith('ch-event');
    expect(sentTo()?.subject).toBe('Your session is cancelled');
    expect(sentTo()?.text).toContain('I’m ill, sorry.');
  });

  it('won’t cancel one whose time has passed', async () => {
    vi.mocked(findBooking).mockResolvedValue(
      session({
        start: at('2027-02-27T15:00:00Z'),
        end: at('2027-02-27T16:00:00Z')
      })
    );
    expect(await cancelBooking('CH-K3P2Q8', {}, 'c', NOW)).toMatchObject({
      ok: false,
      status: 400
    });
    expect(cancelSession).not.toHaveBeenCalled();
  });

  it('keeps the cancellation when the calendar trips, and says so', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(findBooking).mockResolvedValue(session());
    vi.mocked(cancelSession).mockResolvedValue(
      session({ status: 'cancelled' })
    );
    vi.mocked(removeSessionEvent).mockRejectedValue(new Error('Google 500'));
    expect(await cancelBooking('CH-K3P2Q8', {}, 'c', NOW)).toMatchObject({
      ok: true,
      body: { calendar: 'failed', email: 'sent' }
    });
  });
});
