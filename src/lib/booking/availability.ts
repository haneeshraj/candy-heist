import { addMonths, parseDateKey, weekdayIndex, type DateKey } from './dates';

// Placeholder availability until the calendar is connected (Server Action +
// database). It's deterministic, so the same day always shows the same open
// times: sessions run Tuesday, Thursday, Friday and Saturday, from tomorrow
// up to three months ahead, with one or two times on each day already taken.

export const SLOT_TIMES = [
  '10:00',
  '11:30',
  '14:00',
  '16:30',
  '19:00',
  '20:30'
] as const;

export interface Slot {
  time: string;
  open: boolean;
}

/** Monday 0 … Sunday 6; the days sessions run. */
const OPEN_WEEKDAYS = new Set([1, 3, 4, 5]);
export const BOOKING_HORIZON_MONTHS = 3;

// A small string hash, so "taken" times look scattered but never change.
function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function lastBookableDay(today: DateKey): DateKey {
  const { year, month } = addMonths(
    parseDateKey(today),
    BOOKING_HORIZON_MONTHS
  );
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

/** Every time on `key`, open or taken; empty when the day can't be booked. */
export function slotsFor(key: DateKey, today: DateKey): Slot[] {
  if (key <= today || key > lastBookableDay(today)) return [];
  if (!OPEN_WEEKDAYS.has(weekdayIndex(key))) return [];

  const seed = hash(key);
  const taken = new Set([seed % SLOT_TIMES.length]);
  if (seed % 3 === 0) taken.add((seed >>> 3) % SLOT_TIMES.length);

  return SLOT_TIMES.map((time, i) => ({ time, open: !taken.has(i) }));
}

export function isBookable(key: DateKey, today: DateKey) {
  return slotsFor(key, today).some((slot) => slot.open);
}

export function isOpenSlot(key: DateKey, time: string, today: DateKey) {
  return slotsFor(key, today).some((slot) => slot.time === time && slot.open);
}
