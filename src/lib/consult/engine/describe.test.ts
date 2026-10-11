// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  describeBand,
  describeChain,
  formatClock,
  formatDb,
  formatHz,
  formatSpan
} from './describe';
import {
  emptyChain,
  newBand,
  newDynamics,
  newSaturation,
  newSidechain,
  newWidth
} from './params';

describe('tools in words', () => {
  it('reads frequencies, gains and times as a producer would say them', () => {
    expect(formatHz(80)).toBe('80 Hz');
    expect(formatHz(1500)).toBe('1.5 kHz');
    expect(formatHz(16000)).toBe('16 kHz');
    expect(formatDb(4)).toBe('+4 dB');
    expect(formatDb(-3.46)).toBe('−3.5 dB');
    expect(formatDb(0)).toBe('0 dB');
    expect(formatClock(83)).toBe('1:23');
    expect(formatClock(3723)).toBe('1:02:03');
    expect(formatSpan(80, 105)).toBe('1:20–1:45');
  });

  it('says each kind of point by what it reads', () => {
    expect(describeBand({ ...newBand('a', 'bell', 1500), gain: 4 })).toBe(
      'Bell +4 dB at 1.5 kHz, Q 0.9'
    );
    expect(describeBand(newBand('b', 'highcut', 16000))).toBe(
      'High cut 16 kHz, 24 dB/oct'
    );
    expect(describeBand({ ...newBand('c', 'lowshelf', 120), gain: -2 })).toBe(
      'Low shelf −2 dB at 120 Hz'
    );
    expect(describeBand(newBand('d', 'notch', 3000))).toBe(
      'Notch at 3 kHz, Q 6'
    );
  });

  it('lists every tool, the EQ low to high and then the rest in the order heard', () => {
    const lines = describeChain({
      eq: [newBand('hi', 'highcut', 16000), newBand('lo', 'lowcut', 40)],
      saturation: newSaturation(),
      sidechain: newSidechain(124),
      width: newWidth(),
      dynamics: newDynamics('limiter')
    });
    expect(lines).toEqual([
      'Low cut 40 Hz, 24 dB/oct',
      'High cut 16 kHz, 24 dB/oct',
      'Saturation +6 dB drive, 50% mix',
      'Sidechain 1/4 at 124 BPM, 60% deep',
      'Stereo width 120%',
      'Limiter at −6 dB, +3 dB gain'
    ]);
  });

  it('has nothing to say about no tools', () => {
    expect(describeChain(null)).toEqual([]);
    expect(describeChain(emptyChain())).toEqual([]);
  });
});
