import { describe, expect, it } from 'vitest';
import { toRoman } from './roman';

describe('toRoman', () => {
  it('numbers the chapters', () => {
    expect([1, 2, 4, 9, 11, 12, 14, 40, 99].map(toRoman)).toEqual([
      'I',
      'II',
      'IV',
      'IX',
      'XI',
      'XII',
      'XIV',
      'XL',
      'XCIX'
    ]);
  });

  it('has no numeral for zero or fractions', () => {
    expect(() => toRoman(0)).toThrow(RangeError);
    expect(() => toRoman(2.5)).toThrow(RangeError);
  });
});
