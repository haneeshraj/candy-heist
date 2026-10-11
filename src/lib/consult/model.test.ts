// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { closingSoon, formatLeft } from './left';
import {
  OpenConsultationSchema,
  UploadRequestSchema,
  isOpen,
  trackFolder
} from './model';

// As a copy that isn't the live site, so tracks are in consultation-dev/.
beforeAll(() => vi.stubEnv('VERCEL_ENV', 'development'));
afterAll(() => vi.unstubAllEnvs());
const opening = {
  title: 'Menace',
  message: 'Is the drop too dark?',
  durationMs: 200_000,
  bpm: 124,
  days: 7,
  audio: {
    path: 'consultation-dev/abc.wav',
    url: 'https://store1.public.blob.vercel-storage.com/consultation-dev/abc.wav',
    bytes: 50_000_000,
    contentType: 'audio/wav'
  },
  waveform: 'AAAA'
};

const opens = (audio: Partial<typeof opening.audio>) =>
  OpenConsultationSchema.safeParse({
    ...opening,
    audio: { ...opening.audio, ...audio }
  }).success;

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

  it('plays only from a Blob store, the track it names, in its own folder', () => {
    expect(
      opens({ url: 'https://evil.example/consultation-dev/abc.wav' })
    ).toBe(false);
    expect(
      opens({
        url: 'https://public.blob.vercel-storage.com/consultation-dev/abc.wav'
      })
    ).toBe(false);
    expect(
      opens({
        url: 'https://store1.public.blob.vercel-storage.com/consultation-dev/other.wav'
      })
    ).toBe(false);
    expect(
      opens({
        url: 'https://store1.public.blob.vercel-storage.com/consultation-dev/abc.wav?x=1'
      })
    ).toBe(false);
    // The live site's folder isn't this copy's, nor is anywhere else.
    expect(
      opens({
        path: 'consultation/abc.wav',
        url: 'https://store1.public.blob.vercel-storage.com/consultation/abc.wav'
      })
    ).toBe(false);
    expect(opens({ path: 'covers/a.wav' })).toBe(false);
    expect(opens({ path: 'consultation-dev/../covers/a.wav' })).toBe(false);
  });

  it('refuses a file over the limit, or one that isn’t audio', () => {
    expect(opens({ bytes: 300 * 1024 * 1024 })).toBe(false);
    expect(opens({ contentType: 'image/png' })).toBe(false);
  });
});

describe('asking for an upload pass', () => {
  it('takes an audio format Haven shares, up to the limit', () => {
    const ask = { extension: 'wav', contentType: 'audio/wav', bytes: 1000 };
    expect(UploadRequestSchema.safeParse(ask).success).toBe(true);
    expect(
      UploadRequestSchema.safeParse({ ...ask, extension: 'exe' }).success
    ).toBe(false);
    expect(
      UploadRequestSchema.safeParse({ ...ask, contentType: 'text/html' })
        .success
    ).toBe(false);
    expect(
      UploadRequestSchema.safeParse({ ...ask, bytes: 201 * 1024 * 1024 })
        .success
    ).toBe(false);
  });
});

describe('where this copy of the site keeps its tracks', () => {
  it('keeps the live site’s apart from every other copy’s', () => {
    expect(trackFolder({ VERCEL_ENV: 'production' })).toBe('consultation/');
    expect(trackFolder({ VERCEL_ENV: 'preview' })).toBe('consultation-dev/');
    expect(trackFolder({})).toBe('consultation-dev/');
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
