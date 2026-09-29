'use client';

import { useRef } from 'react';
import { useEntrance } from '@/hooks/useEntrance';
import type { Slot } from '@/lib/booking/availability';
import styles from './DateStep.module.scss';

interface TimeSlotsProps {
  slots: Slot[];
  selected: string | null;
  onSelect: (time: string) => void;
  label: string;
}

// A day's times (Figma "Booking / Slot"), mounted per day so they stagger in
// whenever the day changes. Taken times stay listed, struck through.
export default function TimeSlots({
  slots,
  selected,
  onSelect,
  label
}: TimeSlotsProps) {
  const rootRef = useRef<HTMLUListElement | null>(null);
  useEntrance(rootRef, { stagger: 0.05, y: 16 });

  return (
    <ul ref={rootRef} className={styles.slots} aria-label={label}>
      {slots.map((slot) => {
        const isSelected = slot.time === selected;
        return (
          <li key={slot.time} data-enter>
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
              onClick={() => onSelect(slot.time)}
            >
              {slot.time}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
