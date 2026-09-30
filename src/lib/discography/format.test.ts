import { describe, expect, it } from 'vitest';
import { formatDate, timeLeft, totalDuration, trackCount } from './format';

describe('discography format', () => {
  it('writes a date out in full', () => {
    expect(formatDate('2025-05-12')).toBe('12 May 2025');
    expect(formatDate('2026-10-23')).toBe('23 October 2026');
  });

  it('counts tracks', () => {
    expect(trackCount(1)).toBe('1 track');
    expect(trackCount(8)).toBe('8 tracks');
  });

  it('adds up a running time, and gives none when a length is missing', () => {
    expect(
      totalDuration([
        { title: 'a', duration: '4:12' },
        { title: 'b', duration: '3:48' }
      ])
    ).toBe('8:00');
    expect(
      totalDuration([
        { title: 'a', duration: '40:00' },
        { title: 'b', duration: '30:30' }
      ])
    ).toBe('1:10:30');
    expect(totalDuration([{ title: 'a' }])).toBeNull();
  });

  it('counts down to a moment, and stops at zero', () => {
    const now = 0;
    const target = ((2 * 24 + 3) * 60 + 4) * 60 * 1000 + 5000;
    expect(timeLeft(target, now)).toEqual({
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
      done: false
    });
    expect(timeLeft(0, 1000).done).toBe(true);
  });
});
