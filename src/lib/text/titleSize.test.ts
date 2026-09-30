import { describe, expect, it } from 'vitest';
import { titleSize } from './titleSize';

describe('titleSize', () => {
  it('sizes a title by its longest word', () => {
    expect(titleSize('The Great Disconnection', 644, 200)).toBeCloseTo(
      titleSize('Disconnection', 644, 200)
    );
  });

  it('gives wide letters more room than narrow ones', () => {
    expect(titleSize('MMMM', 342, 200)).toBeLessThan(
      titleSize('IIII', 342, 200)
    );
  });

  it('keeps a short title to the largest size', () => {
    expect(titleSize('Omun', 644, 112)).toBe(112);
  });

  it('fits a short, wide title to a phone column', () => {
    const size = titleSize('Omun', 342, 200);
    expect(size).toBeLessThan(342 / 3.2);
  });
});
