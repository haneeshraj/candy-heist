import { describe, expect, it } from 'vitest';
import { isOpenStart, slotsBetween, type SlotRules } from './availability';
import { lastBookableDay, offeredStarts, type Hours } from './hours';
import { slotsByDay, zoneName } from './zone';

// Halifax is on summer time (UTC-3) until 1 November 2026, then UTC-4.
const HOURS: Hours = {
  timeZone: 'America/Halifax',
  weekly: {
    mon: [],
    tue: ['10:00', '14:00'],
    wed: [],
    thu: ['22:30'],
    fri: [],
    sat: [],
    sun: []
  },
  closed: ['2026-10-13'],
  noticeHours: 24,
  horizonMonths: 1,
  bufferMinutes: 15,
  holdMinutes: 15
};
// Monday 5 October, 09:00 in Halifax.
const NOW = new Date('2026-10-05T12:00:00Z');
const rules = (busy: SlotRules['busy'] = []): SlotRules => ({
  hours: HOURS,
  durationMinutes: 60,
  busy,
  now: NOW
});
const at = (iso: string) => new Date(iso);
const interval = (start: string, end: string) => ({
  start: at(start),
  end: at(end)
});

describe('offered times', () => {
  it('reads Candy’s hours in his zone, across the clock change', () => {
    const starts = offeredStarts(
      HOURS,
      at('2026-10-06T00:00:00Z'),
      at('2026-10-07T00:00:00Z')
    );
    expect(starts.map((d) => d.toISOString())).toEqual([
      '2026-10-06T13:00:00.000Z',
      '2026-10-06T17:00:00.000Z'
    ]);
    // A Tuesday after summer time ends: 10:00 is 14:00 UTC.
    expect(
      offeredStarts(
        HOURS,
        at('2026-11-03T00:00:00Z'),
        at('2026-11-04T00:00:00Z')
      )[0].toISOString()
    ).toBe('2026-11-03T14:00:00.000Z');
  });

  it('skips a day off', () => {
    expect(
      offeredStarts(
        HOURS,
        at('2026-10-13T00:00:00Z'),
        at('2026-10-14T00:00:00Z')
      )
    ).toEqual([]);
  });

  it('books to the end of the month, the horizon on', () => {
    expect(lastBookableDay(HOURS, NOW)).toBe('2026-11-30');
  });
});

describe('slots', () => {
  const week = (busy?: SlotRules['busy']) =>
    slotsBetween(
      rules(busy),
      at('2026-10-05T00:00:00Z'),
      at('2026-10-12T00:00:00Z')
    );

  it('offers what’s past the notice, open unless something’s in the way', () => {
    expect(week()).toEqual([
      { start: '2026-10-06T13:00:00.000Z', open: true },
      { start: '2026-10-06T17:00:00.000Z', open: true },
      { start: '2026-10-09T01:30:00.000Z', open: true }
    ]);
  });

  it('keeps a taken time listed, closed, and minds the buffer', () => {
    // Busy from 14:10 UTC: the 13:00 session ends at 14:00, then 15 minutes.
    expect(
      week([interval('2026-10-06T14:10:00Z', '2026-10-06T15:00:00Z')])[0]
    ).toEqual({
      start: '2026-10-06T13:00:00.000Z',
      open: false
    });
    // From 14:20, it fits.
    expect(
      week([interval('2026-10-06T14:20:00Z', '2026-10-06T15:00:00Z')])[0].open
    ).toBe(true);
  });

  it('never offers inside the notice or past the horizon', () => {
    const soon = slotsBetween(
      { ...rules(), now: at('2026-10-05T14:00:00Z') },
      at('2026-10-05T00:00:00Z'),
      at('2026-10-07T00:00:00Z')
    );
    // 13:00 tomorrow is less than 24 hours away now.
    expect(soon.map((slot) => slot.start)).toEqual([
      '2026-10-06T17:00:00.000Z'
    ]);
    expect(
      slotsBetween(
        rules(),
        at('2026-12-01T00:00:00Z'),
        at('2026-12-31T00:00:00Z')
      )
    ).toEqual([]);
  });

  it('checks one start: Candy’s time, bookable and free', () => {
    expect(isOpenStart(rules(), at('2026-10-06T13:00:00Z'))).toBe(true);
    expect(isOpenStart(rules(), at('2026-10-06T13:30:00Z'))).toBe(false);
    expect(
      isOpenStart(
        rules([interval('2026-10-06T13:00:00Z', '2026-10-06T13:30:00Z')]),
        at('2026-10-06T13:00:00Z')
      )
    ).toBe(false);
    expect(isOpenStart(rules(), new Date('nonsense'))).toBe(false);
  });

  it('falls on the visitor’s own days', () => {
    // Thursday 22:30 in Halifax is Friday morning in London.
    const thursday = [{ start: '2026-10-09T01:30:00.000Z', open: true }];
    expect([...slotsByDay(thursday, 'America/Halifax').keys()]).toEqual([
      '2026-10-08'
    ]);
    expect([...slotsByDay(thursday, 'Europe/London').keys()]).toEqual([
      '2026-10-09'
    ]);
    expect(zoneName('Europe/London', at('2026-10-09T01:30:00Z'))).toMatch(
      /United Kingdom|British/
    );
  });
});
