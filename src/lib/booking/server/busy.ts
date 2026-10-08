import 'server-only';
import { calendarBusy } from '@/lib/google/calendar';
import { googleConnected } from '@/lib/google/oauth';
import type { Interval } from '../availability';
import { sessionsBetween } from './store';

// What makes a time taken: anything on Candy's Google Calendar, and the
// sessions booked or held here. Until Candy connects his calendar, his
// hours and the bookings are all there is to go on.

/** His calendar answered with an error, so times can't be shown honestly. */
export class AvailabilityUnavailableError extends Error {
  constructor(cause: unknown) {
    super('Candy’s calendar could not be read.', { cause });
    this.name = 'AvailabilityUnavailableError';
  }
}

/** Google is asked at most this often for the same stretch of time. */
const CALENDAR_FRESH_MS = 60_000;

const store = globalThis as typeof globalThis & {
  __candyHeistBusy?: Map<string, { at: number; busy: Interval[] }>;
};

async function calendarBetween(from: Date, to: Date): Promise<Interval[]> {
  if (!(await googleConnected())) return [];
  const cache = (store.__candyHeistBusy ??= new Map());
  const key = `${from.toISOString()}|${to.toISOString()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CALENDAR_FRESH_MS) return hit.busy;
  try {
    const busy = await calendarBusy(from, to);
    if (cache.size > 200) cache.clear();
    cache.set(key, { at: Date.now(), busy });
    return busy;
  } catch (error) {
    throw new AvailabilityUnavailableError(error);
  }
}

/** Everything busy in [from, to). */
export async function busyBetween(
  from: Date,
  to: Date,
  now = new Date()
): Promise<Interval[]> {
  const [calendar, booked] = await Promise.all([
    calendarBetween(from, to),
    sessionsBetween(from, to, now)
  ]);
  return [...calendar, ...booked];
}

/** Forgets what Google said, so a booking just made shows at once. */
export function forgetCalendar() {
  store.__candyHeistBusy?.clear();
}
