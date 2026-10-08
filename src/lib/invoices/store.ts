import 'server-only';
import { MongoServerError, type Collection } from 'mongodb';
import { getDb } from '@/lib/db/client';
import {
  COLLECTIONS,
  type BookingDocument,
  type InvoiceDocument
} from '@/lib/db/collections';
import { normalizeInvoiceId } from './invoice';

// Each commission's other half, as an invoice: made when the first half is
// paid, under the booking's reference with -2, and paid on /services/pay.
// Looked up by its own ID or the booking's, so either from the receipt works.

const LEASE_MS = 2 * 60 * 1000;

async function invoices(): Promise<Collection<InvoiceDocument>> {
  return (await getDb()).collection<InvoiceDocument>(COLLECTIONS.invoices);
}

export const invoiceRefFor = (bookingRef: string) => `${bookingRef}-2`;

/** The booking's invoice, made the first time it's asked for. */
export async function openInvoice(
  booking: BookingDocument,
  now = new Date()
): Promise<InvoiceDocument> {
  const collection = await invoices();
  const ref = invoiceRefFor(booking.ref);
  const document = {
    ref,
    bookingRef: booking.ref,
    itemName: booking.itemName,
    name: booking.details.name,
    email: booking.details.email,
    totalCents: booking.amounts.totalCents,
    paidCents: booking.amounts.nowCents,
    dueCents: booking.amounts.laterCents,
    currency: booking.amounts.currency,
    status: 'open' as const,
    createdAt: now,
    effects: {}
  };
  try {
    const { insertedId } = await collection.insertOne(
      document as InvoiceDocument
    );
    return { ...document, _id: insertedId } as InvoiceDocument;
  } catch (error) {
    if (!(error instanceof MongoServerError && error.code === 11000))
      throw error;
    const existing = await collection.findOne({ ref });
    if (!existing) throw error;
    return existing;
  }
}

/** By the invoice's ID, or the booking's reference. */
export async function findInvoiceDocument(rawId: string) {
  const id = normalizeInvoiceId(rawId);
  return (await invoices()).findOne({ $or: [{ ref: id }, { bookingRef: id }] });
}

export async function setInvoicePayment(ref: string, paymentIntentId: string) {
  await (await invoices()).updateOne({ ref }, { $set: { paymentIntentId } });
}

export async function markInvoicePaid(
  ref: string,
  paymentIntentId: string,
  now = new Date()
): Promise<InvoiceDocument | null> {
  const collection = await invoices();
  const updated = await collection.findOneAndUpdate(
    { ref, paymentIntentId, status: 'open' },
    { $set: { status: 'paid', paidAt: now } },
    { returnDocument: 'after' }
  );
  return updated ?? collection.findOne({ ref, paymentIntentId });
}

export async function takeInvoiceLease(ref: string, now = new Date()) {
  return (await invoices()).findOneAndUpdate(
    {
      ref,
      status: 'paid',
      $or: [{ lease: { $exists: false } }, { lease: { $lt: now } }]
    },
    { $set: { lease: new Date(now.getTime() + LEASE_MS) } },
    { returnDocument: 'after' }
  );
}

export async function releaseInvoiceLease(ref: string) {
  await (await invoices()).updateOne({ ref }, { $unset: { lease: '' } });
}

export async function recordInvoiceEffect(
  ref: string,
  effect: 'clientEmailAt' | 'candyEmailAt',
  at = new Date()
) {
  await (
    await invoices()
  ).updateOne({ ref }, { $set: { [`effects.${effect}`]: at } });
}
