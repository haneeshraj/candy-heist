'use client';

import { useRef } from 'react';
import { SigilIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import styles from './BookingStepper.module.scss';
import type { BookingStepperProps } from './BookingStepper.types';

// Session → Date & time → Your details → Payment, or Commission → Your
// details → Payment (Figma "Booking / Stepper"). Finished steps turn gilt
// and can be clicked to go back; the connecting rules draw across as each
// step is done.
export default function BookingStepper({
  steps,
  labels,
  current,
  onJump,
  label
}: BookingStepperProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  useEntrance(rootRef, { stagger: 0.08, y: 12 });
  const currentIndex = steps.indexOf(current);

  return (
    <nav ref={rootRef} className={styles.stepper} aria-label={label}>
      <ol className={styles.list}>
        {steps.map((step, i) => {
          const state =
            i < currentIndex
              ? 'done'
              : i === currentIndex
                ? 'active'
                : 'upcoming';
          const content = (
            <>
              <span className={styles.marker} aria-hidden="true">
                {state === 'done' ? (
                  <SigilIcon className={styles.glyph} />
                ) : null}
                {state === 'active' ? <span className={styles.dot} /> : null}
              </span>
              <span className={styles.label}>{labels[step]}</span>
            </>
          );
          return (
            <li
              key={step}
              className={styles.item}
              data-state={state}
              data-enter
            >
              {state === 'done' ? (
                <button
                  type="button"
                  className={styles.step}
                  onClick={() => onJump(step)}
                >
                  {content}
                </button>
              ) : (
                <span
                  className={styles.step}
                  aria-current={state === 'active' ? 'step' : undefined}
                >
                  {content}
                </span>
              )}
              {i < steps.length - 1 ? (
                <span className={styles.line} aria-hidden="true">
                  <span className={styles.lineFill} />
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
