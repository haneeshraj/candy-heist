import { todayIn, type DateKey } from './dates';

// Session times are stored as instants and shown in the visitor's own time
// zone: Candy's hours are set in Halifax time, and someone booking from
// London sees them as London times, with the zone named beside them.

/** The visitor's time zone, as the browser reports it; UTC if it won't say. */
export function visitorTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Whether `zone` is a time zone this runtime knows. */
export function isTimeZone(zone: unknown): zone is string {
  if (typeof zone !== 'string' || zone.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** The day `instant` falls on in `timeZone`. */
export const dayIn = (instant: Date, timeZone: string): DateKey =>
  todayIn(timeZone, instant);

/** "14:00": the 24-hour clock in `timeZone`. */
export function clockIn(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(instant);
}

/** "Atlantic Time", "United Kingdom Time": the zone, named for people. */
export function zoneName(timeZone: string, at: Date = new Date()): string {
  try {
    const part = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      timeZoneName: 'longGeneric'
    })
      .formatToParts(at)
      .find((piece) => piece.type === 'timeZoneName');
    return part?.value ?? timeZone;
  } catch {
    return timeZone;
  }
}

/** Slots by the day they fall on in `timeZone`, in order. */
export function slotsByDay<T extends { start: string }>(
  slots: readonly T[],
  timeZone: string
): Map<DateKey, T[]> {
  const days = new Map<DateKey, T[]>();
  for (const slot of slots) {
    const day = dayIn(new Date(slot.start), timeZone);
    const list = days.get(day);
    if (list) list.push(slot);
    else days.set(day, [slot]);
  }
  return days;
}
