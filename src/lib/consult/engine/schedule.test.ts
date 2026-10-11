// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { emptyChain, newSidechain, type Note } from './params';
import {
  chainedSections,
  covers,
  duckPeriod,
  duckRecovery,
  duckTimes,
  edgesBetween
} from './schedule';

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

describe('the sidechain', () => {
  const sidechain = { ...newSidechain(120), rate: '1/4' as const };

  it('ducks once a beat at 1/4, every half beat at 1/8, once a bar at 1/1', () => {
    expect(duckPeriod(sidechain)).toBeCloseTo(0.5);
    expect(duckPeriod({ ...sidechain, rate: '1/8' })).toBeCloseTo(0.25);
    expect(duckPeriod({ ...sidechain, rate: '1/1' })).toBeCloseTo(2);
  });

  it('lands on the grid from the top of the track', () => {
    expect(duckTimes(sidechain, 0, 2)).toEqual([0.5, 1, 1.5, 2]);
    expect(duckTimes(sidechain, -0.1, 1)).toEqual([0, 0.5, 1]);
  });

  it('never lays the same duck twice across two windows', () => {
    const first = duckTimes(sidechain, 0.3, 1.5);
    const second = duckTimes(sidechain, 1.5, 3);
    expect([...first, ...second]).toEqual([0.5, 1, 1.5, 2, 2.5, 3]);
  });

  it('slides with the offset, to land on the kick', () => {
    const later = { ...sidechain, offset: 100 };
    expect(duckTimes(later, 0, 1.2)).toEqual([0.1, 0.6, 1.1]);
    const earlier = { ...sidechain, offset: -100 };
    expect(duckTimes(earlier, 0, 1)).toEqual([0.4, 0.9]);
  });

  it('comes most of the way back by its release', () => {
    const tc = duckRecovery({ ...sidechain, release: 0.6 });
    // 0.6 of a 0.5 s step, at four time constants (98%).
    expect(tc).toBeCloseTo(0.075);
  });

  it('has nothing to lay over an empty window', () => {
    expect(duckTimes(sidechain, 2, 2)).toEqual([]);
    expect(duckTimes(sidechain, 3, 2)).toEqual([]);
  });
});
