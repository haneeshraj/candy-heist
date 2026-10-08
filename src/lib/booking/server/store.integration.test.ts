// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { BookingDetails } from '../bookingState';

// Bookings and invoices against a real MongoDB, opt-in: set
// TEST_MONGODB_URI to a server you don't mind a scratch database on. It
// makes its own database and drops it after.
//
//   TEST_MONGODB_URI=mongodb://127.0.0.1:27017 npx vitest run store.integration

const uri = process.env.TEST_MONGODB_URI;
const name = `candy_heist_itest_${randomUUID().slice(0, 8)}`;

const details: BookingDetails = {
  name: 'Alex Martin',
  email: 'alex@example.com',
  meetOn: 'meet',
  instagram: '',
  discord: '',
  phone: '',
  note: ''
};
const amounts = {
  totalCents: 12000,
  nowCents: 6000,
  laterCents: 6000,
  currency: 'cad' as const
};

describe.skipIf(!uri)('bookings, against a real database', () => {
  beforeAll(() => {
    vi.stubEnv('MONGODB_URI', uri ?? '');
    vi.stubEnv('MONGODB_DB', name);
  });

  afterAll(async () => {
    const client = await new MongoClient(uri ?? '').connect();
    await client.db(name).dropDatabase();
    await client.close();
    vi.unstubAllEnvs();
  });

  const at = (iso: string) => new Date(iso);
  const sessionFields = (start: string, end: string, holdMinutes = 15) => ({
    kind: 'session' as const,
    itemId: 'dj-lessons',
    itemName: 'DJ Lessons',
    start: at(start),
    end: at(end),
    holdUntil: new Date(Date.now() + holdMinutes * 60_000),
    visitorTimeZone: 'Europe/London',
    details,
    amounts: { ...amounts, nowCents: 12000, laterCents: 0 },
    paymentIntentId: ''
  });

  it('holds a session’s time while it’s paid for, then frees it if not', async () => {
    const store = await import('./store');
    const held = await store.fileBooking(
      sessionFields('2030-01-08T13:00:00Z', '2030-01-08T14:00:00Z')
    );
    expect(held.ref).toMatch(/^CH-[2-9A-HJKMNP-Z]{6}$/);
    const range = [
      at('2030-01-08T00:00:00Z'),
      at('2030-01-09T00:00:00Z')
    ] as const;
    expect(await store.sessionsBetween(...range, new Date())).toHaveLength(1);
    // Once the hold has run out, the time is open again.
    expect(
      await store.sessionsBetween(...range, new Date(Date.now() + 60 * 60_000))
    ).toHaveLength(0);
    await store.dropUnpaid(held.ref);
    expect(await store.findBooking(held.ref)).toBeNull();
  });

  it('gives the time to whoever was filed first when two pay at once', async () => {
    const store = await import('./store');
    const first = await store.fileBooking(
      sessionFields('2030-01-10T13:00:00Z', '2030-01-10T14:00:00Z')
    );
    const second = await store.fileBooking(
      sessionFields('2030-01-10T13:30:00Z', '2030-01-10T14:30:00Z'),
      new Date(first.createdAt.getTime() + 5)
    );
    expect(await store.keepsItsTime(first, 0)).toBe(true);
    expect(await store.keepsItsTime(second, 0)).toBe(false);
    // A buffer reaches a session that only touches it.
    const after = await store.fileBooking(
      sessionFields('2030-01-10T14:00:00Z', '2030-01-10T15:00:00Z'),
      new Date(first.createdAt.getTime() + 10)
    );
    await store.dropUnpaid(second.ref);
    expect(await store.keepsItsTime(after, 0)).toBe(true);
    expect(await store.keepsItsTime(after, 15)).toBe(false);
  });

  it('is paid once, for its own payment, and followed up by one at a time', async () => {
    const store = await import('./store');
    const booking = await store.fileBooking({
      kind: 'commission',
      itemId: 'mixing',
      itemName: 'Mixing',
      visitorTimeZone: 'America/Halifax',
      details,
      amounts,
      paymentIntentId: ''
    });
    await store.setPayment(booking.ref, 'pi_real');

    expect(await store.markPaid(booking.ref, 'pi_other')).toBeNull();
    const paid = await store.markPaid(booking.ref, 'pi_real');
    expect(paid?.status).toBe('paid');
    expect(paid?.expireAt).toBeUndefined();
    const again = await store.markPaid(booking.ref, 'pi_real');
    expect(again?.paidAt).toEqual(paid?.paidAt);

    expect(await store.takeLease(booking.ref)).not.toBeNull();
    expect(await store.takeLease(booking.ref)).toBeNull();
    const effects = await store.recordEffects(booking.ref, { invoiceRef: 'x' });
    expect(effects.invoiceRef).toBe('x');
    await store.releaseLease(booking.ref);
    expect(await store.takeLease(booking.ref)).not.toBeNull();

    const invoices = await import('@/lib/invoices/store');
    const invoice = await invoices.openInvoice(paid!);
    expect(invoice).toMatchObject({
      ref: `${booking.ref}-2`,
      dueCents: 6000,
      paidCents: 6000,
      status: 'open'
    });
    // Made once, found by its own ID or the booking's.
    expect((await invoices.openInvoice(paid!))._id).toEqual(invoice._id);
    expect(
      (await invoices.findInvoiceDocument(booking.ref.toLowerCase()))?.ref
    ).toBe(invoice.ref);
    await invoices.setInvoicePayment(invoice.ref, 'pi_rest');
    expect(
      (await invoices.markInvoicePaid(invoice.ref, 'pi_rest'))?.status
    ).toBe('paid');
  });
});
