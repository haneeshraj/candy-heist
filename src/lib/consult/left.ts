// How long a link stays open, in the words its page uses: "3 days",
// "5 hours", "40 minutes". The largest unit that's at least one, rounded
// down, so it never promises more time than there is.

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const unit = (count: number, one: string) =>
  `${count} ${one}${count === 1 ? '' : 's'}`;

export function formatLeft(ms: number): string {
  if (ms >= DAY) return unit(Math.floor(ms / DAY), 'day');
  if (ms >= HOUR) return unit(Math.floor(ms / HOUR), 'hour');
  return unit(Math.max(1, Math.floor(ms / MINUTE)), 'minute');
}

/** Under a day left: the page says "closes in" rather than "open for". */
export const closingSoon = (ms: number) => ms < DAY;
