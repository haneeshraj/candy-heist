// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { emptyChain, type Note } from './params';
import { chainedSections, covers, edgesBetween } from './schedule';

const section = (id: string, at: number, end: number): Note => ({
  id,
  at,
  end,
  text: '',
  chain: emptyChain()
});

describe('sections', () => {
  it('keeps only sections with tools, in the order they start', () => {
    const notes: Note[] = [
      section('late', 90, 120),
      { id: 'moment', at: 10, end: null, text: 'nice', chain: null },
      { id: 'bare', at: 20, end: 40, text: 'too dark', chain: null },
      section('early', 30, 60)
    ];
    expect(chainedSections(notes).map((s) => s.id)).toEqual(['early', 'late']);
  });

  it('sounds from its start up to its end', () => {
    const s = { at: 30, end: 60 };
    expect(covers(s, 29.99)).toBe(false);
    expect(covers(s, 30)).toBe(true);
    expect(covers(s, 59.99)).toBe(true);
    expect(covers(s, 60)).toBe(false);
  });

  it('switches at its edges, each once', () => {
    const s = { at: 30, end: 60 };
    expect(edgesBetween(s, 0, 2)).toEqual([]);
    expect(edgesBetween(s, 29, 31)).toEqual([{ time: 30, on: true }]);
    expect(edgesBetween(s, 28, 30)).toEqual([{ time: 30, on: true }]);
    // Laid from where the last window ended, so an edge on it isn't laid twice.
    expect(edgesBetween(s, 30, 32)).toEqual([]);
    expect(edgesBetween(s, 0, 100)).toEqual([
      { time: 30, on: true },
      { time: 60, on: false }
    ]);
  });
});
