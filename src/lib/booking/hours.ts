import { z } from 'zod';
import hoursData from '@/content/services/hours.json';
import {
  addDays,
  addMonths,
  isDateKey,
  parseDateKey,
  todayIn,
  weekdayIndex,
  zonedTimeToUtc,
  type DateKey
} from './dates';

// When Candy takes 1-1 sessions: the start times he offers on each day of
// the week, in his own time zone, and the days he's away. A visitor sees
// these converted to their own zone; what's already on his calendar, or
// booked, shows as taken (see availability.ts).
//
// PLACEHOLDER HOURS: Tuesday, Thursday, Friday and Saturday at six times,
// as the booking page showed before it was connected. Candy sets his own.

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'A time is HH:MM');
const times = z.array(time);

export const WEEKDAY_KEYS = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun'
] as const;

export const hoursSchema = z.object({
  /** Where the times below are read: Candy's zone. */
  timeZone: z.string().refine((zone) => {
    try {
      new Intl.DateTimeFormat('en', { timeZone: zone });
      return true;
    } catch {
      return false;
    }
  }, 'Not a time zone'),
  /** The start times offered each weekday, Monday first. */
  weekly: z.object({
    mon: times,
    tue: times,
    wed: times,
    thu: times,
    fri: times,
    sat: times,
    sun: times
  }),
  /** Days off, as YYYY-MM-DD in Candy's zone. */
  closed: z.array(z.string().refine(isDateKey, 'A day is YYYY-MM-DD')),
  /** How far ahead a session has to be booked. */
  noticeHours: z.number().min(0),
  /** How far ahead it can be booked: to the end of the month this many months on. */
  horizonMonths: z.number().int().min(1).max(12),
  /** Free time needed after a session before the next can start. */
  bufferMinutes: z.number().int().min(0),
  /** How long a time is held for someone at the payment step. */
  holdMinutes: z.number().int().min(1)
});

export type Hours = z.infer<typeof hoursSchema>;

export const HOURS: Hours = hoursSchema.parse(hoursData);

/** The last day sessions can be booked on, in Candy's zone. */
export function lastBookableDay(hours: Hours, now: Date): DateKey {
  const { year, month } = addMonths(
    parseDateKey(todayIn(hours.timeZone, now)),
    hours.horizonMonths
  );
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

/** The window a session can start in: from the notice to the horizon. */
export function bookableWindow(hours: Hours, now: Date) {
  const earliest = new Date(now.getTime() + hours.noticeHours * 3_600_000);
  const latest = zonedTimeToUtc(
    addDays(lastBookableDay(hours, now), 1),
    '00:00',
    hours.timeZone
  );
  return { earliest, latest };
}

/**
 * Every start time Candy offers in [from, to), whether or not it's free,
 * soonest first. Days are walked in his zone, so a time near midnight
 * lands on the right day wherever the visitor is.
 */
export function offeredStarts(hours: Hours, from: Date, to: Date): Date[] {
  const starts: Date[] = [];
  const closed = new Set(hours.closed);
  // A day either side, so the edges of the range in other zones are covered.
  let day = addDays(todayIn(hours.timeZone, from), -1);
  const lastDay = addDays(todayIn(hours.timeZone, to), 1);
  while (day <= lastDay) {
    if (!closed.has(day)) {
      const weekday = WEEKDAY_KEYS[weekdayIndex(day)];
      for (const at of hours.weekly[weekday]) {
        const start = zonedTimeToUtc(day, at, hours.timeZone);
        if (start >= from && start < to) starts.push(start);
      }
    }
    day = addDays(day, 1);
  }
  return starts.sort((a, b) => a.getTime() - b.getTime());
}
