'use client';

import { useLenis } from 'lenis/react';
import { useState, useSyncExternalStore } from 'react';
import type { Invoice } from '@/lib/invoices/invoice';
import type { PaidInvoice } from '@/lib/invoices/payInvoice';
import FindInvoice from './FindInvoice';
import InvoicePaid from './InvoicePaid';
import InvoicePayment from './InvoicePayment';
import styles from './PayInvoice.module.scss';
import type { PayInvoiceProps } from './PayInvoice.types';

type Stage =
  | { name: 'find' }
  | { name: 'pay'; invoice: Invoice }
  | { name: 'paid'; invoice: Invoice; paid: PaidInvoice };

export const INVOICE_PARAM = 'invoice';

const noSubscribe = () => () => {};
const linkedId = () =>
  new URLSearchParams(window.location.search).get(INVOICE_PARAM);

// "Pay an invoice": a commission's other half. Find the invoice by its ID
// (a link from the email brings it in, ?invoice=), pay it, done. The ID
// stays in the address while it's open, so a reload keeps it.
export default function PayInvoice({ copy }: PayInvoiceProps) {
  const [stage, setStage] = useState<Stage>({ name: 'find' });
  const lenis = useLenis();
  // An ID from the email's link; read on the client, gone once the ID is
  // taken out of the address.
  const linked = useSyncExternalStore(noSubscribe, linkedId, () => null);

  function go(next: Stage) {
    setStage(next);
    const url = new URL(window.location.href);
    if (next.name === 'find') url.searchParams.delete(INVOICE_PARAM);
    else url.searchParams.set(INVOICE_PARAM, next.invoice.id);
    window.history.replaceState(null, '', url);
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }

  return (
    <div className={styles.page}>
      {stage.name === 'find' ? (
        <FindInvoice
          key={linked ?? 'blank'}
          copy={copy.find}
          initialId={linked ?? ''}
          onFound={(invoice) => go({ name: 'pay', invoice })}
        />
      ) : null}
      {stage.name === 'pay' ? (
        <InvoicePayment
          copy={copy.pay}
          placeholder={copy.price}
          invoice={stage.invoice}
          onPaid={(paid) => go({ name: 'paid', invoice: stage.invoice, paid })}
          onBack={() => go({ name: 'find' })}
        />
      ) : null}
      {stage.name === 'paid' ? (
        <InvoicePaid
          copy={copy.paid}
          placeholder={copy.price}
          invoice={stage.invoice}
        />
      ) : null}
    </div>
  );
}
