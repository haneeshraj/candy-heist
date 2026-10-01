'use client';

import { useId, useRef, useState } from 'react';
import { PaymentPanel } from '@/components/booking/PaymentPanel';
import { StepHeading } from '@/components/booking/StepHeading';
import { SigilChip } from '@/components/common/SigilChip';
import { useEntrance } from '@/hooks/useEntrance';
import { invoiceAmounts } from '@/lib/invoices/invoice';
import { payInvoice } from '@/lib/invoices/payInvoice';
import { fill } from '@/lib/text/fill';
import styles from './PayInvoice.module.scss';
import type { InvoicePaymentProps } from './PayInvoice.types';

// The invoice found: what's due, the card, and beside it the invoice
// itself (the commission, its price, what was paid upfront, what's due).
export default function InvoicePayment({
  copy,
  placeholder,
  invoice,
  onPaid,
  onBack
}: InvoicePaymentProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const headingId = useId();
  const [paying, setPaying] = useState(false);
  useEntrance(rootRef, { delay: 0.3 });
  const amounts = invoiceAmounts(invoice, placeholder);

  async function pay() {
    if (paying) return;
    setPaying(true);
    try {
      onPaid(await payInvoice(invoice));
    } finally {
      setPaying(false);
    }
  }

  const rows = [
    { label: copy.slip.invoice, value: invoice.id },
    { label: copy.slip.price, value: amounts.price },
    { label: copy.slip.paid, value: amounts.paid }
  ];

  return (
    <section ref={rootRef} className={styles.step} aria-labelledby={headingId}>
      <div className={styles.layout}>
        <div className={styles.main}>
          <StepHeading
            id={headingId}
            label={fill(copy.label, { id: invoice.id })}
            heading={copy.heading}
            sub={copy.sub}
          />
          <div className={styles.panelSlot} data-enter>
            <PaymentPanel
              copy={copy}
              amount={amounts.due}
              paying={paying}
              onPay={() => void pay()}
            />
          </div>
          <div className={styles.back} data-enter>
            <SigilChip
              variant="ghost"
              icon={null}
              onClick={onBack}
              disabled={paying}
            >
              {copy.back}
            </SigilChip>
          </div>
        </div>

        <aside className={styles.slip} aria-label={copy.slip.label} data-enter>
          <p className={styles.slipLabel}>{copy.slip.label}</p>
          <p className={styles.slipItem}>
            {invoice.itemName ?? copy.slip.item}
          </p>
          <dl className={styles.slipRows}>
            {rows.map((row) => (
              <div key={row.label} className={styles.slipRow}>
                <dt className={styles.slipKey}>{row.label}</dt>
                <dd className={styles.slipValue}>{row.value}</dd>
              </div>
            ))}
          </dl>
          <div className={styles.slipDue}>
            <span className={styles.slipKey}>{copy.slip.due}</span>
            <span className={styles.slipDueValue}>{amounts.due}</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
