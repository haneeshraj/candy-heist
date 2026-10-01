import type { Metadata } from 'next';
import { PayInvoice } from '@/components/services/PayInvoice';
import { invoiceCopy } from '@/content/services/invoice';

export const metadata: Metadata = invoiceCopy.meta;

// Paying a commission's other half, with the invoice ID from Candy's
// email. Everything happens client-side in PayInvoice.
export default function PayRoute() {
  return (
    <main>
      <PayInvoice copy={invoiceCopy} />
    </main>
  );
}
