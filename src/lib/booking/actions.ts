'use server';

import { z } from 'zod';
import { getServices } from '@/content/services/getServices';
import { DatabaseUnavailableError } from '@/lib/db/client';
import { withinHourlyLimit } from '@/lib/forms/limits';
import { invoiceRefFor } from '@/lib/invoices/store';
import {
  createCardPayment,
  getStripe,
  PaymentsUnavailableError,
  retrievePayment
} from '@/lib/payments/stripe';
import { isOpenStart, slotEnd } from './availability';
import type { BookingConfirmation, BookingDetails } from './bookingState';
import { chargeFor } from './price';
import { AvailabilityUnavailableError, busyBetween } from './server/busy';
import { finalizeBooking } from './server/finalize';
import {
  dropUnpaid,
  fileBooking,
  findBooking,
  keepsItsTime,
  setPayment
} from './server/store';
import { validateDetails, type DetailsMessages } from './validation';
import { isTimeZone } from './zone';

// Paying for a booking, in two calls from the payment step. Start: checked
// again here (anyone can call this, not just the page), the time held, and
// a payment opened with Stripe for what's due now. The page then confirms
// the card with Stripe itself. Finish: Stripe is asked whether it went
// through, and if so the booking is paid and followed up (finalize.ts).

/** Pay presses one visitor can make in an hour. */
const HOURLY_LIMIT = 12;

// The server only needs to know whether there's a problem, not to word it.
const PLAIN: DetailsMessages = {
  name: 'name',
  email: 'email',
  emailInvalid: 'email',
  instagram: 'instagram',
  discord: 'discord',
  discordRequired: 'discord',
  phone: 'phone',
  note: 'note'
};

const startSchema = z.object({
  itemId: z.string().max(80),
  /** A session's start, as an ISO instant; null for a commission. */
  start: z.string().max(40).nullable(),
  /** The visitor's zone, so their emails read in their time. */
  timeZone: z.string().max(64),
  details: z.object({
    name: z.string().max(200),
    email: z.string().max(254),
    meetOn: z.enum(['meet', 'discord']),
    instagram: z.string().max(80),
    discord: z.string().max(80),
    phone: z.string().max(60),
    note: z.string().max(2000)
  }),
  /** A payment this one replaces (the visitor went back and changed something). */
  replaces: z
    .object({ ref: z.string().max(40), clientSecret: z.string().max(300) })
    .nullable()
    .optional()
});

export type StartBookingInput = z.input<typeof startSchema>;

export type StartBookingResult =
  | { ok: true; ref: string; clientSecret: string }
  | {
      ok: false;
      reason: 'invalid' | 'unpriced' | 'taken' | 'limited' | 'unavailable';
    };

const tidy = (details: BookingDetails): BookingDetails => ({
  name: details.name.trim(),
  email: details.email.trim(),
  meetOn: details.meetOn,
  instagram: details.instagram.trim(),
  discord: details.discord.trim(),
  phone: details.phone.trim(),
  note: details.note.trim()
});

/** Lets go of a payment the visitor is replacing, if it's really theirs. */
async function letGo(replaces: { ref: string; clientSecret: string }) {
  const old = await findBooking(replaces.ref);
  if (!old || old.status !== 'awaiting-payment' || !old.paymentIntentId) return;
  const payment = await retrievePayment(old.paymentIntentId);
  if (payment.client_secret !== replaces.clientSecret) return;
  if (payment.status === 'succeeded') return;
  if (payment.status !== 'canceled')
    await getStripe().paymentIntents.cancel(payment.id);
  await dropUnpaid(old.ref);
}

export async function startBookingPayment(
  raw: StartBookingInput
): Promise<StartBookingResult> {
  const parsed = startSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: 'invalid' };
  const input = parsed.data;

  let services;
  try {
    services = await getServices();
  } catch (error) {
    console.error('The services could not be read for a booking.', error);
    return { ok: false, reason: 'unavailable' };
  }
  const { hours } = services;
  const item = services.items.find((entry) => entry.id === input.itemId);
  if (!item || !isTimeZone(input.timeZone))
    return { ok: false, reason: 'invalid' };
  if (item.price === undefined) return { ok: false, reason: 'unpriced' };

  const session = item.kind === 'session';
  const details = tidy({
    ...input.details,
    meetOn: session ? input.details.meetOn : 'meet'
  });
  if (Object.keys(validateDetails(details, PLAIN)).length > 0)
    return { ok: false, reason: 'invalid' };

  const start = session && input.start ? new Date(input.start) : null;
  if (session && (!start || Number.isNaN(start.getTime())))
    return { ok: false, reason: 'invalid' };

  try {
    if (!(await withinHourlyLimit('booking-payment', HOURLY_LIMIT)))
      return { ok: false, reason: 'limited' };
    if (input.replaces) await letGo(input.replaces);

    const now = new Date();
    let end: Date | undefined;
    if (start) {
      const durationMinutes = item.durationMinutes ?? 60;
      end = slotEnd(start, durationMinutes);
      const margin =
        (durationMinutes + hours.bufferMinutes) * 60_000 + 86_400_000;
      const busy = await busyBetween(
        new Date(start.getTime() - margin),
        new Date(start.getTime() + margin),
        now
      );
      if (!isOpenStart({ hours, durationMinutes, busy, now }, start))
        return { ok: false, reason: 'taken' };
    }

    const charge = chargeFor(item.kind, item.price);
    const booking = await fileBooking({
      kind: item.kind,
      itemId: item.id,
      itemName: item.name,
      ...(start && end
        ? {
            start,
            end,
            holdUntil: new Date(now.getTime() + hours.holdMinutes * 60_000)
          }
        : {}),
      visitorTimeZone: input.timeZone,
      details,
      amounts: {
        totalCents: charge.total,
        nowCents: charge.now,
        laterCents: charge.later,
        currency: 'cad'
      },
      paymentIntentId: ''
    });

    if (!(await keepsItsTime(booking, hours.bufferMinutes))) {
      await dropUnpaid(booking.ref);
      return { ok: false, reason: 'taken' };
    }

    let payment;
    try {
      payment = await createCardPayment({
        amountCents: charge.now,
        description: `${item.name}${item.kind === 'commission' ? ', first half' : ''} · ${booking.ref}`,
        metadata: { purpose: 'booking', ref: booking.ref },
        idempotencyKey: `booking-${booking.ref}`
      });
    } catch (error) {
      await dropUnpaid(booking.ref);
      throw error;
    }
    await setPayment(booking.ref, payment.id);
    if (!payment.client_secret)
      throw new Error('Stripe gave no client secret.');
    return { ok: true, ref: booking.ref, clientSecret: payment.client_secret };
  } catch (error) {
    if (
      !(error instanceof DatabaseUnavailableError) &&
      !(error instanceof PaymentsUnavailableError) &&
      !(error instanceof AvailabilityUnavailableError)
    )
      console.error('A booking payment could not be started.', error);
    return { ok: false, reason: 'unavailable' };
  }
}

export type FinishBookingResult =
  | { ok: true; confirmation: BookingConfirmation }
  | { ok: false; reason: 'unpaid' | 'unknown' | 'unavailable' };

export async function finishBookingPayment(
  ref: unknown,
  clientSecret: unknown
): Promise<FinishBookingResult> {
  if (typeof ref !== 'string' || typeof clientSecret !== 'string')
    return { ok: false, reason: 'unknown' };
  try {
    const booking = await findBooking(ref);
    if (!booking?.paymentIntentId) return { ok: false, reason: 'unknown' };
    const payment = await retrievePayment(booking.paymentIntentId);
    if (payment.client_secret !== clientSecret)
      return { ok: false, reason: 'unknown' };
    if (payment.status !== 'succeeded') return { ok: false, reason: 'unpaid' };

    // Paid either way; if the follow-up trips, Stripe's webhook runs it again.
    let settled = booking;
    try {
      settled = (await finalizeBooking(ref, payment.id)) ?? booking;
    } catch (error) {
      console.error(`Booking ${ref} is paid, but its follow-up failed.`, error);
    }

    return {
      ok: true,
      confirmation: {
        reference: settled.ref,
        itemId: settled.itemId,
        kind: settled.kind,
        start: settled.start?.toISOString() ?? null,
        end: settled.end?.toISOString() ?? null,
        timeZone: settled.visitorTimeZone,
        meetOn: settled.details.meetOn,
        name: settled.details.name,
        email: settled.details.email,
        invoiceRef:
          settled.kind === 'commission'
            ? (settled.effects.invoiceRef ?? invoiceRefFor(settled.ref))
            : null
      }
    };
  } catch (error) {
    if (
      !(error instanceof DatabaseUnavailableError) &&
      !(error instanceof PaymentsUnavailableError)
    )
      console.error('A booking payment could not be finished.', error);
    return { ok: false, reason: 'unavailable' };
  }
}
