import { describe, expect, it } from 'vitest';
import { fill } from './fill';

describe('fill', () => {
  it('fills each placeholder', () => {
    expect(fill('{shown} of {total} releases', { shown: 8, total: 14 })).toBe(
      '8 of 14 releases'
    );
  });

  it('leaves a placeholder it has no value for', () => {
    expect(fill('Out {date}', {})).toBe('Out {date}');
  });
});
