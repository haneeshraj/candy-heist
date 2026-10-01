import { isInvoiceId, normalizeInvoiceId, type Invoice } from './invoice';

// Finding an invoice and paying it. For now both are stand-ins: any ID in
// the right shape is found, with its commission and amounts unknown (the
// page shows its placeholders), and paying hands back when. Looking it up
// in the database and taking the payment (Stripe) arrive with the Server
// Actions; the page already awaits both, so swapping them in changes
// nothing else.

export class InvoiceNotFoundError extends Error {
  constructor(id: string) {
    super(`No invoice ${id}.`);
    this.name = 'InvoiceNotFoundError';
  }
}

export async function findInvoice(rawId: string): Promise<Invoice> {
  const id = normalizeInvoiceId(rawId);
  if (!isInvoiceId(id)) throw new InvoiceNotFoundError(id);
  return { id, itemName: null };
}

export interface PaidInvoice {
  id: string;
  paidAt: string;
}

export async function payInvoice(invoice: Invoice): Promise<PaidInvoice> {
  return { id: invoice.id, paidAt: new Date().toISOString() };
}
