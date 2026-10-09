import { bookableWindow, offeredStarts, type Hours } from './hours';

// What's open to book: the start times Candy offers (hours.ts), less any
// that would run into something already on his calendar or booked, or
// into the free time he keeps around a session. Pure: the busy times come
// in from the server (lib/booking/server/busy.ts), so the same rules decide
// what the page shows and check the time again when it's paid for.

export interface Interval {
  start: Date;
  end: Date;
}

export interface Slot {
  /** When it starts, as an ISO instant. */
  start: string;
  open: boolean;
}

export interface SlotRules {
  hours: Hours;
  /** The session's length. */
  durationMinutes: number;
  /** Candy's calendar, and the sessions booked or held. */
  busy: readonly Interval[];
  now: Date;
}

export const slotEnd = (start: Date, durationMinutes: number) =>
  new Date(start.getTime() + durationMinutes * 60_000);

/** True when [start, end) plus the buffer either side runs into a busy time. */
export function clashes(
  start: Date,
  end: Date,
  busy: readonly Interval[],
  bufferMinutes: number
) {
  const gap = bufferMinutes * 60_000;
  return busy.some(
    (taken) =>
      taken.start.getTime() < end.getTime() + gap &&
      taken.end.getTime() + gap > start.getTime()
  );
}

/**
 * The busy times with `own` cut out of them: what's busy apart from one
 * thing already in them (a session's own event, when it's being moved).
 */
export function withoutInterval(
  busy: readonly Interval[],
  own: Interval
): Interval[] {
  return busy.flatMap((taken) => {
    if (taken.end <= own.start || taken.start >= own.end) return [taken];
    const left: Interval[] = [];
    if (taken.start < own.start)
      left.push({ start: taken.start, end: own.start });
    if (taken.end > own.end) left.push({ start: own.end, end: taken.end });
    return left;
  });
}

/**
 * Every offered time starting in [from, to) that can still be booked
 * (past the notice, within the horizon), open or taken, soonest first.
 * Taken ones are kept, so the page can list them struck through.
 */
export function slotsBetween(rules: SlotRules, from: Date, to: Date): Slot[] {
  const { hours, durationMinutes, busy, now } = rules;
  const { earliest, latest } = bookableWindow(hours, now);
  const start = from > earliest ? from : earliest;
  const end = to < latest ? to : latest;
  if (start >= end) return [];

  return offeredStarts(hours, start, end).map((at) => ({
    start: at.toISOString(),
    open: !clashes(at, slotEnd(at, durationMinutes), busy, hours.bufferMinutes)
  }));
}

/** Whether `start` is one of Candy's times, bookable, and free. */
export function isOpenStart(rules: SlotRules, start: Date): boolean {
  if (Number.isNaN(start.getTime())) return false;
  const slots = slotsBetween(rules, start, new Date(start.getTime() + 1));
  return slots.length === 1 && slots[0].open;
}
