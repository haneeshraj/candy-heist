// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  correlationOf,
  gatedLoudness,
  kWeighting,
  lufsOf,
  type Biquad
} from './meters';

/** A biquad run over samples in plain arithmetic, as the IIRFilterNode runs it. */
function filter({ b, a }: Biquad, input: Float64Array): Float64Array {
  const output = new Float64Array(input.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let n = 0; n < input.length; n++) {
    const x = input[n];
    const y = b[0] * x + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    output[n] = y;
  }
  return output;
}

describe('loudness, as ITU-R BS.1770 measures it', () => {
  it('weights with the standard’s own filters at 48 kHz', () => {
    const { shelf, highpass } = kWeighting(48000);
    const close = (actual: number[], expected: number[]) =>
      actual.forEach((value, i) => expect(value).toBeCloseTo(expected[i], 8));
    close(shelf.b, [1.53512485958697, -2.69169618940638, 1.19839281085285]);
    close(shelf.a, [1, -1.69065929318241, 0.73248077421585]);
    close(highpass.b, [1, -2, 1]);
    close(highpass.a, [1, -1.99004745483398, 0.99007225036621]);
  });

  it('reads a full-scale 1 kHz sine in one channel as −3.01 LUFS', () => {
    for (const rate of [44100, 48000]) {
      const { shelf, highpass } = kWeighting(rate);
      const sine = Float64Array.from({ length: rate * 2 }, (_, n) =>
        Math.sin((2 * Math.PI * 1000 * n) / rate)
      );
      const weighted = filter(highpass, filter(shelf, sine));
      // The second second, the filters long settled.
      const tail = weighted.subarray(rate);
      const energy = tail.reduce((sum, y) => sum + y * y, 0) / tail.length;
      expect(lufsOf(energy)).toBeCloseTo(-3.01, 1);
    }
  });

  it('reads silence as nothing at all', () => {
    expect(lufsOf(0)).toBe(-Infinity);
    expect(gatedLoudness([])).toBe(-Infinity);
  });

  it('gates out what’s quieter than −70 LUFS, then 10 LU under the rest', () => {
    const at = (lufs: number) => 10 ** ((lufs + 0.691) / 10);
    // Twenty loud blocks, a fade under the relative gate, and near silence.
    const blocks = [
      ...Array.from({ length: 20 }, () => at(-14)),
      ...Array.from({ length: 10 }, () => at(-30)),
      ...Array.from({ length: 10 }, () => at(-80))
    ];
    expect(gatedLoudness(blocks)).toBeCloseTo(-14, 5);
    // Within 10 LU, a quieter stretch counts.
    const close = [at(-14), at(-14), at(-20), at(-20)];
    expect(gatedLoudness(close)).toBeCloseTo(
      lufsOf((2 * at(-14) + 2 * at(-20)) / 4),
      5
    );
  });
});

describe('the two sides’ correlation', () => {
  const tone = Float32Array.from({ length: 512 }, (_, i) => Math.sin(i / 7));

  it('is +1 for mono, −1 for one side upside down, 0 for unrelated sides', () => {
    expect(correlationOf(tone, tone)).toBeCloseTo(1, 6);
    expect(
      correlationOf(
        tone,
        tone.map((v) => -v)
      )
    ).toBeCloseTo(-1, 6);
    const other = Float32Array.from({ length: 512 }, (_, i) => Math.cos(i / 7));
    expect(Math.abs(correlationOf(tone, other))).toBeLessThan(0.1);
  });

  it('has no reading in silence', () => {
    const quiet = new Float32Array(512);
    expect(correlationOf(quiet, quiet)).toBeNaN();
  });
});
