'use client';

import { useRef } from 'react';
import { useEntrance } from '@/hooks/useEntrance';
import { slotsFor } from '@/lib/booking/availability';
import { monthGrid, WEEKDAYS } from '@/lib/booking/calendar';
import { formatDayLong, type DateKey } from '@/lib/booking/dates';
import styles from './DateStep.module.scss';

interface CalendarDaysProps {
  year: number;
  month: number;
  today: DateKey;
  selected: DateKey | null;
  onSelect: (date: DateKey) => void;
  openTimesLabel: string;
}

// One month of days (Figma "Booking / Day"). Mounted per month, so the days
// cascade in each time the month changes. Only free days are buttons.
export default function CalendarDays({
  year,
  month,
  today,
  selected,
  onSelect,
  openTimesLabel
}: CalendarDaysProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEntrance(rootRef, { stagger: 0.012, y: 12 });
  const weeks = monthGrid(year, month);

  return (
    <div ref={rootRef} className={styles.days}>
      {WEEKDAYS.map((day) => (
        <span key={day} className={styles.weekday} aria-hidden="true">
          {day}
        </span>
      ))}
      {weeks.flat().map((cell) => {
        const open = cell.inMonth
          ? slotsFor(cell.key, today).filter((slot) => slot.open).length
          : 0;
        const isToday = cell.key === today;
        const isSelected = cell.key === selected;

        if (!cell.inMonth || !open)
          return (
            <span
              key={cell.key}
              className={styles.day}
              data-state={cell.inMonth ? 'unavailable' : 'outside'}
              data-enter
              aria-hidden={cell.inMonth ? undefined : 'true'}
            >
              {cell.day}
              {isToday && cell.inMonth ? (
                <span className={styles.today} aria-hidden="true" />
              ) : null}
            </span>
          );

        return (
          <button
            key={cell.key}
            type="button"
            className={styles.day}
            data-state={isSelected ? 'selected' : 'available'}
            aria-pressed={isSelected}
            aria-label={`${formatDayLong(cell.key)}, ${open} ${openTimesLabel}`}
            onClick={() => onSelect(cell.key)}
            data-enter
          >
            {cell.day}
            <span className={styles.open} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
