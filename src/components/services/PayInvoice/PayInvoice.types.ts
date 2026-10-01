import type { InvoiceCopy } from '@/content/services/invoice';
import type { Invoice } from '@/lib/invoices/invoice';
import type { PaidInvoice } from '@/lib/invoices/payInvoice';

export interface PayInvoiceProps {
  copy: InvoiceCopy;
}

export interface FindInvoiceProps {
  copy: InvoiceCopy['find'];
  /** From the email's link, if it brought one. */
  initialId: string;
  onFound: (invoice: Invoice) => void;
}

export interface InvoicePaymentProps {
  copy: InvoiceCopy['pay'];
  /** Shown for an amount the invoice doesn't have yet. */
  placeholder: string;
  invoice: Invoice;
  onPaid: (paid: PaidInvoice) => void;
  onBack: () => void;
}

export interface InvoicePaidProps {
  copy: InvoiceCopy['paid'];
  placeholder: string;
  invoice: Invoice;
}
