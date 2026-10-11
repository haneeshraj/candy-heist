// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  WAVEFORM_COLUMNS,
  byteToSample,
  compactPeaks,
  decodeWaveform,
  encodeWaveform,
  sampleToByte
} from './peaks';

/** A survey as AUDITORIUM makes it: trough, crest, tone per column. */
const survey = (columns: number, at: (i: number) => [number, number, number]) =>
  Float32Array.from(
    { length: columns * 3 },
    (_, i) => at(Math.floor(i / 3))[i % 3]
  );

describe('the waveform that travels with the page', () => {
  it('keeps the deepest trough and the highest crest of what it folds together', () => {
    const peaks = survey(4, (i) => (i === 1 ? [-0.9, 0.2, 1] : [-0.1, 0.8, 0]));
    const bytes = compactPeaks(peaks, 2);
    expect(bytes.length).toBe(6);
    expect(byteToSample(bytes[0])).toBeCloseTo(-0.9, 1);
    expect(byteToSample(bytes[1])).toBeCloseTo(0.8, 1);
    expect(bytes[2]).toBe(128); // the mean tone of 1 and 0, as a byte
  });

  it('never makes more columns than the survey has', () => {
    expect(compactPeaks(survey(10, () => [0, 0, 0])).length).toBe(30);
    expect(compactPeaks(survey(9000, () => [0, 0, 0])).length).toBe(
      WAVEFORM_COLUMNS * 3
    );
  });

  it('clamps what is out of range rather than wrapping it', () => {
    expect(sampleToByte(-3)).toBe(0);
    expect(sampleToByte(3)).toBe(255);
  });

  it('survives the trip as text', () => {
    const bytes = compactPeaks(
      survey(5000, (i) => [-(i % 7) / 7, (i % 5) / 5, (i % 3) / 3])
    );
    const text = encodeWaveform(bytes);
    expect(decodeWaveform(text)).toEqual(bytes);
  });

  it('refuses text no Haven would have sent', () => {
    expect(decodeWaveform('')).toBeNull();
    expect(decodeWaveform(42)).toBeNull();
    expect(decodeWaveform('not base64 at all!')).toBeNull();
    expect(decodeWaveform(btoa('ab'))).toBeNull(); // not whole columns
    expect(decodeWaveform('A'.repeat(20000))).toBeNull(); // far too long
  });
});
