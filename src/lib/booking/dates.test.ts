import { describe, expect, it } from 'vitest';
import { slotsFor } from './availability';
import { monthGrid } from './calendar';
import {
  addMonths,
  formatDayLong,
  formatDayMedium,
  isDateKey,
  todayIn,
  weekdayIndex,
  zonedTimeToUtc
} from './dates';

describe('dates', () => {
  it('formats a day the way the page reads it', () => {
    expect(formatDayLong('2026-10-08')).toBe('Thursday 8 October');
    expect(formatDayMedium('2026-10-08')).toBe('Thu 8 October');
  });

  it('counts weekdays from Monday', () => {
    expect(weekdayIndex('2026-10-05')).toBe(0); // a Monday
    expect(weekdayIndex('2026-10-11')).toBe(6); // a Sunday
  });

  it('rejects impossible dates', () => {
    expect(isDateKey('2026-02-30')).toBe(false);
    expect(isDateKey('2026-10-08')).toBe(true);
  });

  it('rolls months over the year', () => {
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({
      year: 2027,
      month: 1
    });
  });

  it('turns Halifax wall-clock time into the right instant, either side of the clocks changing', () => {
    // Summer: Atlantic Daylight Time, UTC−3.
    expect(
      zonedTimeToUtc('2026-10-08', '14:00', 'America/Halifax').toISOString()
    ).toBe('2026-10-08T17:00:00.000Z');
    // Winter: Atlantic Standard Time, UTC−4.
    expect(
      zonedTimeToUtc('2026-12-10', '14:00', 'America/Halifax').toISOString()
    ).toBe('2026-12-10T18:00:00.000Z');
  });

  it("finds today's date in the sessions' zone", () => {
    // 02:00 UTC on the 9th is still the 8th in Halifax.
    expect(todayIn('America/Halifax', new Date('2026-10-09T02:00:00Z'))).toBe(
      '2026-10-08'
    );
  });
});

describe('monthGrid', () => {
  it('lays a month out in whole Monday-first weeks', () => {
    const weeks = monthGrid(2026, 10);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    // 1 October 2026 is a Thursday: three days of September lead it in.
    expect(
      weeks[0].slice(0, 4).map((cell) => [cell.day, cell.inMonth])
    ).toEqual([
      [28, false],
      [29, false],
      [30, false],
      [1, true]
    ]);
  });
});

describe('availability', () => {
  const today = '2026-09-28';

  it('opens Tuesdays, Thursdays, Fridays and Saturdays, with a time or two taken', () => {
    const thursday = slotsFor('2026-10-01', today);
    expect(thursday).toHaveLength(6);
    expect(thursday.some((slot) => !slot.open)).toBe(true);
    expect(slotsFor('2026-10-05', today)).toEqual([]); // Monday
  });

  it('never offers today, the past, or beyond three months', () => {
    expect(slotsFor(today, today)).toEqual([]);
    expect(slotsFor('2026-09-01', today)).toEqual([]);
    expect(slotsFor('2027-01-05', today)).toEqual([]);
  });

  it('shows the same times for the same day every time', () => {
    expect(slotsFor('2026-10-08', today)).toEqual(
      slotsFor('2026-10-08', today)
    );
  });
});
