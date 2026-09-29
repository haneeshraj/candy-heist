import { describe, expect, it } from 'vitest';
import { groupWords } from './groupWords';

describe('groupWords', () => {
  it('groups letters into words, keeping their original indices', () => {
    expect(groupWords(Array.from('DJ LESSONS'))).toEqual([
      { kind: 'word', start: 0, chars: ['D', 'J'] },
      { kind: 'space', index: 2 },
      { kind: 'word', start: 3, chars: Array.from('LESSONS') }
    ]);
  });

  it('keeps every space, including runs of them', () => {
    const groups = groupWords(Array.from('A  B'));
    expect(groups.map((group) => group.kind)).toEqual([
      'word',
      'space',
      'space',
      'word'
    ]);
  });
});
