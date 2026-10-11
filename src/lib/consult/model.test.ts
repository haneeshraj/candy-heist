// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { closingSoon, formatLeft } from './left';
import { OpenConsultationSchema, isOpen } from './model';

const opening = {
  title: 'Menace',
  message: 'Is the drop too dark?',
  durationMs: 200_000,
  bpm: 124,
  days: 7,
  audio: {
    path: 'consultation/abc.wav',
    url: 'https://firebasestorage.googleapis.com/v0/b/candy/o/consultation%2Fabc.wav?alt=media&token=t',
    bytes: 50_000_000,
    contentType: 'audio/wav'
  },
  waveform: 'AAAA'
};

describe('what Haven sends to open a link', () => {
  it('takes a week at most', () => {
    expect(OpenConsultationSchema.safeParse(opening).success).toBe(true);
    expect(
      OpenConsultationSchema.safeParse({ ...opening, days: 8 }).success
    ).toBe(false);
    expect(
      OpenConsultationSchema.safeParse({ ...opening, days: 0 }).success
    ).toBe(false);
  });

  it('plays only from Firebase Storage, and only from its own folder', () => {
    const elsewhere = { ...opening.audio, url: 'https://evil.example/a.wav' };
    expect(
      OpenConsultationSchema.safeParse({ ...opening, audio: elsewhere }).success
    ).toBe(false);
    const outside = { ...opening.audio, path: 'covers/a.wav' };
    expect(
      OpenConsultationSchema.safeParse({ ...opening, audio: outside }).success
    ).toBe(false);
    const climbing = { ...opening.audio, path: 'consultation/../covers/a.wav' };
    expect(
      OpenConsultationSchema.safeParse({ ...opening, audio: climbing }).success
    ).toBe(false);
  });

  it('refuses a file over the limit, or one that isn’t audio', () => {
    const big = { ...opening.audio, bytes: 300 * 1024 * 1024 };
    expect(
      OpenConsultationSchema.safeParse({ ...opening, audio: big }).success
    ).toBe(false);
    const image = { ...opening.audio, contentType: 'image/png' };
    expect(
      OpenConsultationSchema.safeParse({ ...opening, audio: image }).success
    ).toBe(false);
  });
});

describe('whether a link is open', () => {
  const now = new Date('2026-10-10T12:00:00Z');
  it('is open until it expires or is closed', () => {
    expect(
      isOpen(
        { expiresAt: new Date('2026-10-11T00:00:00Z'), endedAt: null },
        now
      )
    ).toBe(true);
    expect(isOpen({ expiresAt: now, endedAt: null }, now)).toBe(false);
    expect(
      isOpen({ expiresAt: new Date('2026-10-11T00:00:00Z'), endedAt: now }, now)
    ).toBe(false);
  });
});

describe('how long a link stays open, in words', () => {
  it('uses the largest whole unit, never more than is left', () => {
    expect(formatLeft(3 * 24 * 3600_000 + 5 * 3600_000)).toBe('3 days');
    expect(formatLeft(24 * 3600_000)).toBe('1 day');
    expect(formatLeft(5.9 * 3600_000)).toBe('5 hours');
    expect(formatLeft(40 * 60_000)).toBe('40 minutes');
    expect(formatLeft(10_000)).toBe('1 minute');
    expect(closingSoon(23 * 3600_000)).toBe(true);
    expect(closingSoon(24 * 3600_000)).toBe(false);
  });
});
