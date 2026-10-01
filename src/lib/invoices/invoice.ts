import { formatAmount } from '@/lib/booking/price';

// An invoice for a commission's other half: Candy sends one when the work
// is ready, and it's paid on /services/pay with its ID. The amounts are in
// cents; they're unknown (undefined) until the database holds them, and
// the page shows its placeholder.

export interface Invoice {
  id: string;
  /** The commission it's for; null until the database says. */
  itemName: string | null;
  totalCents?: number;
  paidCents?: number;
  dueCents?: number;
}

export interface InvoiceAmounts {
  price: string;
  paid: string;
  due: string;
}

/** Letters, digits and dashes: what an ID from the email can hold. */
const ID_PATTERN = /^[A-Z0-9][A-Z0-9-]{3,39}$/;

/** The ID as typed, tidied: trimmed, upper case, inner spaces gone. */
export const normalizeInvoiceId = (value: string) =>
  value.trim().toUpperCase().replace(/\s+/g, '');

export const isInvoiceId = (value: string) =>
  ID_PATTERN.test(normalizeInvoiceId(value));

export function invoiceAmounts(
  invoice: Invoice,
  placeholder: string
): InvoiceAmounts {
  const show = (cents?: number) =>
    cents === undefined ? placeholder : formatAmount(cents);
  return {
    price: show(invoice.totalCents),
    paid: show(invoice.paidCents),
    due: show(invoice.dueCents)
  };
}
