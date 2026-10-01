'use client';

import { useId, useRef } from 'react';
import { SigilChip } from '@/components/common/SigilChip';
import { SigilIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import BookingSummary from '../BookingSummary/BookingSummary';
import PaymentPanel from '../PaymentPanel/PaymentPanel';
import StepHeading from '../StepHeading/StepHeading';
import styles from './PaymentStep.module.scss';
import type { PaymentStepProps } from './PaymentStep.types';

// Figma "Payment": the heading, the payment panel (half a commission's
// price, or a whole session's), and beside it the summary and what to
// expect.
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

          <div className={styles.panelSlot} data-enter>
            <PaymentPanel
              copy={copy}
              amount={price}
              paying={paying}
              onPay={onPay}
            />
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
