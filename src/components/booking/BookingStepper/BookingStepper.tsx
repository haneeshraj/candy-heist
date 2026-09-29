'use client';

import { useRef } from 'react';
import { SigilIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import { STEPPER_STEPS } from '@/lib/booking/bookingState';
import styles from './BookingStepper.module.scss';
import type { BookingStepperProps } from './BookingStepper.types';

// Session → Date & time → Your details → Payment (Figma "Booking /
// Stepper"). Finished steps turn gilt and can be clicked to go back; the
// connecting rules draw across as each step is done.
export default function BookingStepper({
  labels,
  current,
  onJump,
  label
}: BookingStepperProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  useEntrance(rootRef, { stagger: 0.08, y: 12 });
  const currentIndex = STEPPER_STEPS.indexOf(current);

  return (
    <nav ref={rootRef} className={styles.stepper} aria-label={label}>
      <ol className={styles.list}>
        {STEPPER_STEPS.map((step, i) => {
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
              {i < STEPPER_STEPS.length - 1 ? (
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
