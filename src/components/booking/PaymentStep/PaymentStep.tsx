'use client';

import { useId, useRef } from 'react';
import { CornerTicks } from '@/components/common/CornerTicks';
import { SigilChip } from '@/components/common/SigilChip';
import { ArrowIcon, SigilIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import { fill } from '@/lib/booking/format';
import BookingSummary from '../BookingSummary/BookingSummary';
import StepHeading from '../StepHeading/StepHeading';
import styles from './PaymentStep.module.scss';
import type { PaymentStepProps } from './PaymentStep.types';

// Figma "Payment", card only: an advance for a session, the full price for
// a commission. The fields below mark where Stripe's own card form mounts:
// card details are typed into Stripe's frame, never
// into this page, so these are placeholders rather than inputs until the
// Stripe keys and the Server Action are in.
export default function PaymentStep({
  copy,
  summary,
  price,
  paying,
  onPay,
  onBack
}: PaymentStepProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const headingId = useId();
  useEntrance(rootRef, { delay: 0.3 });

  const placeholders = [
    { key: 'number', label: copy.card.number, value: '1234 1234 1234 1234' },
    { key: 'expiry', label: copy.card.expiry, value: 'MM / YY' },
    { key: 'cvc', label: copy.card.cvc, value: '123' },
    { key: 'name', label: copy.card.name, value: '' }
  ];

  return (
    <section ref={rootRef} className={styles.step} aria-labelledby={headingId}>
      <div className={styles.layout}>
        <div className={styles.main}>
          <StepHeading
            id={headingId}
            label={copy.label}
            heading={copy.heading}
            sub={copy.sub}
          />

          <div className={styles.panel} data-enter>
            <CornerTicks />
            <div className={styles.panelHead}>
              <p className={styles.panelLabel}>{copy.panel}</p>
              <p className={styles.amount}>{price}</p>
            </div>

            <div className={styles.card} data-stripe-slot aria-hidden="true">
              {placeholders.map((field) => (
                <div
                  key={field.key}
                  className={styles.cardField}
                  data-field={field.key}
                >
                  <span className={styles.cardLabel}>{field.label}</span>
                  <span className={styles.cardBox}>{field.value}</span>
                </div>
              ))}
            </div>

            <SigilChip
              variant="solid"
              icon={<ArrowIcon />}
              onClick={onPay}
              disabled={paying}
              aria-busy={paying || undefined}
            >
              {paying ? copy.paying : fill(copy.cta, { price })}
            </SigilChip>
            <p className={styles.secure}>{copy.secure}</p>
          </div>

          <div className={styles.actions} data-enter>
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

        <div className={styles.aside}>
          <BookingSummary {...summary} />
          <ul className={styles.notes}>
            {copy.notes.map((note) => (
              <li key={note.title} className={styles.note} data-enter>
                <SigilIcon className={styles.noteSigil} />
                <span>
                  <span className={styles.noteTitle}>{note.title}</span>
                  <span className={styles.noteText}>{note.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
