'use client';

import { useId, useRef } from 'react';
import { Rings } from '@/components/common/Rings';
import { SigilChip } from '@/components/common/SigilChip';
import { WordReveal } from '@/components/common/WordReveal';
import { ArrowIcon, SigilIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import { invoiceAmounts } from '@/lib/invoices/invoice';
import styles from './PayInvoice.module.scss';
import type { InvoicePaidProps } from './PayInvoice.types';

// Paid: said once, with the invoice and what was paid, and the way on.
export default function InvoicePaid({
  copy,
  placeholder,
  invoice
}: InvoicePaidProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const headingId = useId();
  useEntrance(rootRef, { delay: 0.2, stagger: 0.09 });
  const { due } = invoiceAmounts(invoice, placeholder);

  return (
    <section ref={rootRef} className={styles.paid} aria-labelledby={headingId}>
      <Rings className={styles.rings} />
      <div className={styles.paidMain}>
        <span className={styles.seal} data-enter aria-hidden="true">
          <SigilIcon />
        </span>
        <h2 id={headingId} className={styles.paidHeading}>
          <WordReveal text={copy.heading} trigger="mount" startDelay={0.3} />
        </h2>
        <WordReveal
          as="p"
          className={styles.paidBody}
          text={copy.body}
          trigger="mount"
          startDelay={0.6}
          staggerDelay={0.02}
        />
        <dl className={styles.receipt} data-enter>
          <div className={styles.slipRow}>
            <dt className={styles.slipKey}>{copy.receipt.invoice}</dt>
            <dd className={styles.slipValue}>{invoice.id}</dd>
          </div>
          <div className={styles.slipRow}>
            <dt className={styles.slipKey}>{copy.receipt.paid}</dt>
            <dd className={styles.slipValue}>{due}</dd>
          </div>
        </dl>
        <div className={styles.paidActions} data-enter>
          <SigilChip variant="outline" icon={<ArrowIcon />} href="/services">
            {copy.services}
          </SigilChip>
          <SigilChip variant="ghost" icon={null} href="/">
            {copy.home}
          </SigilChip>
        </div>
      </div>
    </section>
  );
}
