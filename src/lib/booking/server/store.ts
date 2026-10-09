import 'server-only';
import { MongoServerError, type Collection } from 'mongodb';
import { getDb } from '@/lib/db/client';
import {
  COLLECTIONS,
  type BookingDocument,
  type BookingEffects
} from '@/lib/db/collections';
import { newRef } from '@/lib/inbox/ref';
import type { Interval } from '../availability';

// Bookings in the database. One is filed the moment Pay is pressed,
// awaiting payment, and for a session it holds the time for a few minutes
// while the card goes through. Once Stripe says it's paid, it's paid for
// good, and whoever gets there first (the page or Stripe's webhook) takes
// a short lease to follow it up, so nothing is done twice.

/** An unpaid booking is deleted after this long. */
const ABANDON_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
/** How long one follow-up may take before another can take over. */
const LEASE_MS = 2 * 60 * 1000;

async function bookings(): Promise<Collection<BookingDocument>> {
  return (await getDb()).collection<BookingDocument>(COLLECTIONS.bookings);
}

export type NewBooking = Omit<
  BookingDocument,
  '_id' | 'ref' | 'status' | 'createdAt' | 'updatedAt' | 'expireAt' | 'effects'
>;

const isDuplicate = (error: unknown) =>
  error instanceof MongoServerError && error.code === 11000;

/** Files a booking awaiting payment, under a fresh reference. */
export async function fileBooking(
  fields: NewBooking,
  now = new Date()
): Promise<BookingDocument> {
  const collection = await bookings();
  for (let attempt = 0; attempt < 5; attempt++) {
    const document = {
      ...fields,
      ref: newRef('CH'),
      status: 'awaiting-payment' as const,
      createdAt: now,
      updatedAt: now,
      expireAt: new Date(now.getTime() + ABANDON_AFTER_MS),
      effects: {}
    };
    try {
      const { insertedId } = await collection.insertOne(
        document as BookingDocument
      );
      return { ...document, _id: insertedId } as BookingDocument;
    } catch (error) {
      if (!isDuplicate(error)) throw error;
    }
  }
  throw new Error('No free booking reference after five tries.');
}

export async function setPayment(ref: string, paymentIntentId: string) {
  await (await bookings()).updateOne({ ref }, { $set: { paymentIntentId } });
}

export async function findBooking(ref: string) {
  return (await bookings()).findOne({ ref });
}

/** Drops a booking that was never paid (its time goes back on offer). */
export async function dropUnpaid(ref: string) {
  await (await bookings()).deleteOne({ ref, status: 'awaiting-payment' });
}

const holding = (now: Date) => ({
  $or: [
    { status: 'paid' as const },
    { status: 'awaiting-payment' as const, holdUntil: { $gt: now } }
  ]
});

/** The sessions booked, or held for someone paying, in [from, to). */
export async function sessionsBetween(
  from: Date,
  to: Date,
  now: Date
): Promise<Interval[]> {
  const found = await (
    await bookings()
  )
    .find(
      {
        kind: 'session',
        start: { $lt: to },
        end: { $gt: from },
        ...holding(now)
      },
      { projection: { start: 1, end: 1 } }
    )
    .toArray();
  return found.flatMap((booking) =>
    booking.start && booking.end
      ? [{ start: booking.start, end: booking.end }]
      : []
  );
}

/**
 * Whether `booking` keeps its time after all: two people can press Pay on
 * the same time at once, and both get past the check before either is
 * filed. Then a paid session wins, else whoever was filed first.
 */
export async function keepsItsTime(
  booking: BookingDocument,
  bufferMinutes: number,
  now = new Date()
): Promise<boolean> {
  if (!booking.start || !booking.end) return true;
  const gap = bufferMinutes * 60_000;
  const overlapping = {
    kind: 'session' as const,
    ref: { $ne: booking.ref },
    start: { $lt: new Date(booking.end.getTime() + gap) },
    end: { $gt: new Date(booking.start.getTime() - gap) }
  };
  const rival = await (
    await bookings()
  ).findOne({
    $or: [
      { ...overlapping, status: 'paid' },
      {
        ...overlapping,
        status: 'awaiting-payment',
        holdUntil: { $gt: now },
        $or: [
          { createdAt: { $lt: booking.createdAt } },
          { createdAt: booking.createdAt, ref: { $lt: booking.ref } }
        ]
      }
    ]
  });
  return rival === null;
}

/**
 * Marks it paid, once, if `paymentIntentId` is its payment. Hands back the
 * booking as it stands either way; null when there's no such booking.
 */
export async function markPaid(
  ref: string,
  paymentIntentId: string,
  now = new Date()
): Promise<BookingDocument | null> {
  const collection = await bookings();
  const updated = await collection.findOneAndUpdate(
    { ref, paymentIntentId, status: 'awaiting-payment' },
    {
      $set: { status: 'paid', paidAt: now, updatedAt: now },
      $unset: { holdUntil: '', expireAt: '' }
    },
    { returnDocument: 'after' }
  );
  return updated ?? collection.findOne({ ref, paymentIntentId });
}

/** The lease to follow a paid booking up; null if someone else has it. */
export async function takeLease(ref: string, now = new Date()) {
  return (await bookings()).findOneAndUpdate(
    {
      ref,
      status: 'paid',
      $or: [{ lease: { $exists: false } }, { lease: { $lt: now } }]
    },
    { $set: { lease: new Date(now.getTime() + LEASE_MS) } },
    { returnDocument: 'after' }
  );
}

export async function releaseLease(ref: string) {
  await (await bookings()).updateOne({ ref }, { $unset: { lease: '' } });
}

/** Records what's been done, and hands back everything done so far. */
export async function recordEffects(
  ref: string,
  done: Partial<BookingEffects>
): Promise<BookingEffects> {
  const set = Object.fromEntries(
    Object.entries(done).map(([key, value]) => [`effects.${key}`, value])
  );
  const updated = await (
    await bookings()
  ).findOneAndUpdate(
    { ref },
    { $set: { ...set, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  return updated?.effects ?? {};
}

/** Marks it changed for Haven: its invoice was paid. */
export async function touchBooking(ref: string, now = new Date()) {
  await (await bookings()).updateOne({ ref }, { $set: { updatedAt: now } });
}

// ------------------------------------------------------- for Candy Haven

/**
 * The paid and cancelled bookings changed at or after `since`, oldest
 * change first, at most `limit` of them. At or after, not after: two
 * changes can share a millisecond, and Haven files by reference, so
 * seeing one twice changes nothing.
 */
export async function bookingsChangedSince(since: Date, limit: number) {
  return (await bookings())
    .find({
      status: { $in: ['paid', 'cancelled'] },
      updatedAt: { $gte: since }
    })
    .sort({ updatedAt: 1 })
    .limit(limit)
    .toArray();
}

/**
 * Another session that holds [start, end), with `bufferMinutes` either
 * side: paid, or held for someone paying. Null when the time is free of
 * bookings.
 */
export async function rivalSession(
  ref: string,
  start: Date,
  end: Date,
  bufferMinutes: number,
  now = new Date()
) {
  const gap = bufferMinutes * 60_000;
  return (await bookings()).findOne({
    kind: 'session',
    ref: { $ne: ref },
    start: { $lt: new Date(end.getTime() + gap) },
    end: { $gt: new Date(start.getTime() - gap) },
    ...holding(now)
  });
}

/**
 * Moves a paid session from `from` to [start, end), if it's still paid
 * and still at `from`: null when it was moved or cancelled in between.
 */
export async function moveSession(
  ref: string,
  from: Date,
  to: { start: Date; end: Date },
  by: string,
  now = new Date()
) {
  return (await bookings()).findOneAndUpdate(
    { ref, kind: 'session', status: 'paid', start: from },
    {
      $set: { start: to.start, end: to.end, updatedAt: now },
      $push: { moves: { from, to: to.start, at: now, by } }
    },
    { returnDocument: 'after' }
  );
}

/**
 * Cancels a paid session, so its time is open again: null when it's not
 * a paid session (cancelled already, or never paid).
 */
export async function cancelSession(
  ref: string,
  by: string,
  note: string,
  now = new Date()
) {
  return (await bookings()).findOneAndUpdate(
    { ref, kind: 'session', status: 'paid' },
    {
      $set: {
        status: 'cancelled',
        cancelledAt: now,
        cancelledBy: by,
        cancelNote: note,
        updatedAt: now
      }
    },
    { returnDocument: 'after' }
  );
}
