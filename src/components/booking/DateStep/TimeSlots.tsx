'use client';

import { useRef } from 'react';
import { useEntrance } from '@/hooks/useEntrance';
import type { Slot } from '@/lib/booking/availability';
import { clockIn } from '@/lib/booking/zone';
import styles from './DateStep.module.scss';

interface TimeSlotsProps {
  slots: Slot[];
  /** The start picked (ISO). */
  selected: string | null;
  onSelect: (start: string) => void;
  /** The visitor's zone, which the times are shown in. */
  timeZone: string;
  label: string;
}

// A day's times (Figma "Booking / Slot"), mounted per day so they stagger in
// whenever the day changes. Taken times stay listed, struck through.
export default function TimeSlots({
  slots,
  selected,
  onSelect,
  timeZone,
  label
}: TimeSlotsProps) {
  const rootRef = useRef<HTMLUListElement | null>(null);
  useEntrance(rootRef, { stagger: 0.05, y: 16 });

  return (
    <ul ref={rootRef} className={styles.slots} aria-label={label}>
      {slots.map((slot) => {
        const isSelected = slot.start === selected;
        return (
          <li key={slot.start} data-enter>
            <button
              type="button"
              className={styles.slot}
              data-state={
                !slot.open
                  ? 'unavailable'
                  : isSelected
                    ? 'selected'
                    : 'available'
              }
              disabled={!slot.open}
              aria-pressed={slot.open ? isSelected : undefined}
              onClick={() => onSelect(slot.start)}
            >
              {clockIn(new Date(slot.start), timeZone)}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
