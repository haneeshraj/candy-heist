// Calendar days travel through the booking flow as 'YYYY-MM-DD' keys and
// times as 'HH:MM', both in the sessions' own time zone (Halifax). Keys are
// formatted through a UTC Date so the visitor's own zone never shifts a day.

export type DateKey = string;

export interface DayParts {
  year: number;
  /** 1–12 */
  month: number;
  day: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateKey({ year, month, day }: DayParts): DateKey {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function parseDateKey(key: DateKey): DayParts {
  const [year, month, day] = key.split('-').map(Number);
  return { year, month, day };
}

export function isDateKey(value: unknown): value is DateKey {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const { year, month, day } = parseDateKey(value);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const utcDate = (key: DateKey) => {
  const { year, month, day } = parseDateKey(key);
  return new Date(Date.UTC(year, month - 1, day));
};

/** Monday is 0, Sunday 6. */
export function weekdayIndex(key: DateKey) {
  return (utcDate(key).getUTCDay() + 6) % 7;
}

export function addDays(key: DateKey, days: number): DateKey {
  const date = utcDate(key);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  });
}

export function addMonths(
  { year, month }: Pick<DayParts, 'year' | 'month'>,
  months: number
) {
  const index = year * 12 + (month - 1) + months;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

const format = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...options });

const LONG = format({ weekday: 'long', day: 'numeric', month: 'long' });
const MEDIUM = format({ weekday: 'short', day: 'numeric', month: 'long' });
const SHORT = format({ weekday: 'short', day: 'numeric', month: 'short' });
const MONTH = format({ month: 'long', year: 'numeric' });

/** "Thursday 8 October" */
export const formatDayLong = (key: DateKey) =>
  LONG.format(utcDate(key)).replace(',', '');
/** "Thu 8 October" */
export const formatDayMedium = (key: DateKey) =>
  MEDIUM.format(utcDate(key)).replace(',', '');
/** "Thu 8 Oct" */
export const formatDayShort = (key: DateKey) =>
  SHORT.format(utcDate(key)).replace(',', '');
/** "October 2026" */
export const formatMonth = (year: number, month: number) =>
  MONTH.format(new Date(Date.UTC(year, month - 1, 1)));

/** Today's date in `timeZone`, as a key. */
export function todayIn(timeZone: string, now = new Date()): DateKey {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return toDateKey({ year: get('year'), month: get('month'), day: get('day') });
}

// Minutes `timeZone` is ahead of UTC at `instant` (Halifax: -180 or -240).
function zoneOffsetMinutes(timeZone: string, instant: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).formatToParts(instant);
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second')
  );
  return Math.round((asUtc - instant.getTime()) / 60000);
}

/** The instant a wall-clock `time` on `key` happens in `timeZone`. */
export function zonedTimeToUtc(
  key: DateKey,
  time: string,
  timeZone: string
): Date {
  const { year, month, day } = parseDateKey(key);
  const [hours, minutes] = time.split(':').map(Number);
  const wallClock = Date.UTC(year, month - 1, day, hours, minutes);
  // Two passes settle the offset either side of a daylight-saving change.
  let offset = zoneOffsetMinutes(timeZone, new Date(wallClock));
  offset = zoneOffsetMinutes(timeZone, new Date(wallClock - offset * 60000));
  return new Date(wallClock - offset * 60000);
}
