import { addDays, toDateKey, weekdayIndex, type DateKey } from './dates';

export interface CalendarCell {
  key: DateKey;
  day: number;
  /** False for the leading and trailing days of the neighbouring months. */
  inMonth: boolean;
}

/** A month as whole Monday-first weeks, padded with the neighbours' days. */
export function monthGrid(year: number, month: number): CalendarCell[][] {
  const first = toDateKey({ year, month, day: 1 });
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lead = weekdayIndex(first);
  const cellCount = Math.ceil((lead + daysInMonth) / 7) * 7;

  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cellCount; i++) {
    const key = addDays(first, i - lead);
    const [, keyMonth, keyDay] = key.split('-').map(Number);
    if (i % 7 === 0) weeks.push([]);
    weeks[weeks.length - 1].push({
      key,
      day: keyDay,
      inMonth: keyMonth === month
    });
  }
  return weeks;
}

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
