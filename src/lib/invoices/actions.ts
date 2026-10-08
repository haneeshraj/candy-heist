'use server';

import { finalizeInvoice } from '@/lib/booking/server/finalize';
import { DatabaseUnavailableError } from '@/lib/db/client';
import type { InvoiceDocument } from '@/lib/db/collections';
import { withinHourlyLimit } from '@/lib/forms/limits';
import {
  createCardPayment,
  PaymentsUnavailableError,
  retrievePayment
} from '@/lib/payments/stripe';
import { isInvoiceId, type Invoice, type PaidInvoice } from './invoice';
import { findInvoiceDocument, setInvoicePayment } from './store';

// Paying an invoice on /services/pay: find it by the ID on the receipt
// (or the booking's reference), open a payment for what's due, and once
// the card has gone through on the page, check with Stripe and settle it.

/** Lookups one visitor can make in an hour, so IDs can't be guessed at. */
const HOURLY_LIMIT = 20;

const toInvoice = (document: InvoiceDocument): Invoice => ({
  id: document.ref,
  itemName: document.itemName,
  totalCents: document.totalCents,
  paidCents: document.paidCents,
  dueCents: document.dueCents,
  status: document.status
});

const quiet = (error: unknown) =>
  error instanceof DatabaseUnavailableError ||
  error instanceof PaymentsUnavailableError;

export type LookUpInvoiceResult =
  | { ok: true; invoice: Invoice }
  | { ok: false; reason: 'notFound' | 'limited' | 'unavailable' };

export async function lookUpInvoice(
  rawId: unknown
): Promise<LookUpInvoiceResult> {
  if (typeof rawId !== 'string' || !isInvoiceId(rawId))
    return { ok: false, reason: 'notFound' };
  try {
    if (!(await withinHourlyLimit('invoice-lookup', HOURLY_LIMIT)))
      return { ok: false, reason: 'limited' };
    const found = await findInvoiceDocument(rawId);
    return found
      ? { ok: true, invoice: toInvoice(found) }
      : { ok: false, reason: 'notFound' };
  } catch (error) {
    if (!quiet(error)) console.error('An invoice lookup failed.', error);
    return { ok: false, reason: 'unavailable' };
  }
}

export type StartInvoiceResult =
  | { ok: true; clientSecret: string }
  | { ok: false; reason: 'notFound' | 'paid' | 'unavailable' };

/** Statuses a payment can still be confirmed from. */
const CONFIRMABLE = new Set([
  'requires_payment_method',
  'requires_confirmation',
  'requires_action'
]);

export async function startInvoicePayment(
  rawId: unknown
): Promise<StartInvoiceResult> {
  if (typeof rawId !== 'string' || !isInvoiceId(rawId))
    return { ok: false, reason: 'notFound' };
  try {
    const invoice = await findInvoiceDocument(rawId);
    if (!invoice) return { ok: false, reason: 'notFound' };
    if (invoice.status === 'paid') return { ok: false, reason: 'paid' };

    // The payment already opened for it, while it can still be used.
    if (invoice.paymentIntentId) {
      const open = await retrievePayment(invoice.paymentIntentId);
      if (open.status === 'succeeded') {
        await finalizeInvoice(invoice.ref, open.id);
        return { ok: false, reason: 'paid' };
      }
      if (CONFIRMABLE.has(open.status) && open.client_secret)
        return { ok: true, clientSecret: open.client_secret };
    }

    const payment = await createCardPayment({
      amountCents: invoice.dueCents,
      description: `${invoice.itemName}, the rest · ${invoice.ref}`,
      metadata: { purpose: 'invoice', ref: invoice.ref },
      // A new key only once the last payment can't be used any more.
      idempotencyKey: `invoice-${invoice.ref}-${invoice.paymentIntentId ?? 'first'}`
    });
    await setInvoicePayment(invoice.ref, payment.id);
    if (!payment.client_secret)
      throw new Error('Stripe gave no client secret.');
    return { ok: true, clientSecret: payment.client_secret };
  } catch (error) {
    if (!quiet(error))
      console.error('An invoice payment could not start.', error);
    return { ok: false, reason: 'unavailable' };
  }
}

export type FinishInvoiceResult =
  | { ok: true; paid: PaidInvoice }
  | { ok: false; reason: 'unpaid' | 'unknown' | 'unavailable' };

export async function finishInvoicePayment(
  rawId: unknown,
  clientSecret: unknown
): Promise<FinishInvoiceResult> {
  if (typeof rawId !== 'string' || typeof clientSecret !== 'string')
    return { ok: false, reason: 'unknown' };
  try {
    const invoice = await findInvoiceDocument(rawId);
    if (!invoice?.paymentIntentId) return { ok: false, reason: 'unknown' };
    const payment = await retrievePayment(invoice.paymentIntentId);
    if (payment.client_secret !== clientSecret)
      return { ok: false, reason: 'unknown' };
    if (payment.status !== 'succeeded') return { ok: false, reason: 'unpaid' };

    let paidAt = new Date();
    try {
      const settled = await finalizeInvoice(invoice.ref, payment.id);
      paidAt = settled?.paidAt ?? paidAt;
    } catch (error) {
      console.error(
        `Invoice ${invoice.ref} is paid, but its follow-up failed.`,
        error
      );
    }
    return {
      ok: true,
      paid: { id: invoice.ref, paidAt: paidAt.toISOString() }
    };
  } catch (error) {
    if (!quiet(error))
      console.error('An invoice payment could not finish.', error);
    return { ok: false, reason: 'unavailable' };
  }
}
