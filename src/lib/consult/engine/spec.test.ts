// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  MAX_CHAINED_SECTIONS,
  MAX_EQ_BANDS,
  chainIsEmpty,
  emptyChain,
  newBand,
  newDynamics,
  newSidechain,
  type Feedback,
  type Note
} from './params';
import { parseChain, parseFeedback } from './spec';

const note = (over: Partial<Note> = {}): Note => ({
  id: 'n1',
  at: 83,
  end: null,
  text: 'Needs more high end',
  chain: null,
  ...over
});

const feedback = (over: Partial<Feedback> = {}): Feedback => ({
  name: 'Nasko',
  notes: [note()],
  chain: null,
  ...over
});

const boosted = () => ({
  ...emptyChain(),
  eq: [{ ...newBand('b1', 'bell', 1500), gain: 4 }]
});

describe('feedback as it arrives', () => {
  it('takes a note at a moment', () => {
    expect(parseFeedback(feedback())).toEqual(feedback());
  });

  it('takes a section with tools on it, and tools on the whole song', () => {
    const sent = feedback({
      notes: [note({ end: 105, chain: boosted() })],
      chain: { ...emptyChain(), dynamics: newDynamics('limiter') }
    });
    expect(parseFeedback(sent)).toEqual(sent);
  });

  it('trims the name, and refuses none', () => {
    expect(parseFeedback(feedback({ name: '  Nasko  ' }))?.name).toBe('Nasko');
    expect(parseFeedback(feedback({ name: '   ' }))).toBeNull();
  });

  it('refuses tools on a moment: a moment has no length to hear them over', () => {
    expect(
      parseFeedback(feedback({ notes: [note({ chain: boosted() })] }))
    ).toBeNull();
  });

  it('refuses a section that ends before it starts, or is barely there', () => {
    expect(parseFeedback(feedback({ notes: [note({ end: 80 })] }))).toBeNull();
    expect(
      parseFeedback(feedback({ notes: [note({ end: 83.2 })] }))
    ).toBeNull();
  });

  it('refuses a note that says nothing and carries nothing', () => {
    expect(
      parseFeedback(feedback({ notes: [note({ text: ' ' })] }))
    ).toBeNull();
    // A section can speak through its tools alone.
    expect(
      parseFeedback(
        feedback({ notes: [note({ text: '', end: 100, chain: boosted() })] })
      )
    ).not.toBeNull();
  });

  it('refuses feedback with neither a note nor a tool', () => {
    expect(parseFeedback(feedback({ notes: [] }))).toBeNull();
    expect(
      parseFeedback(feedback({ notes: [], chain: boosted() }))
    ).not.toBeNull();
  });

  it('refuses a value outside its range', () => {
    const loud = {
      ...emptyChain(),
      eq: [{ ...newBand('b1', 'bell'), gain: 40 }]
    };
    expect(parseFeedback(feedback({ notes: [], chain: loud }))).toBeNull();
    const fast = {
      ...emptyChain(),
      sidechain: { ...newSidechain(), bpm: 999 }
    };
    expect(parseFeedback(feedback({ notes: [], chain: fast }))).toBeNull();
  });

  it('caps the points, and the sections with tools', () => {
    const many = {
      ...emptyChain(),
      eq: Array.from({ length: MAX_EQ_BANDS + 1 }, (_, i) =>
        newBand(`b${i}`, 'notch', 200 + i * 100)
      )
    };
    expect(parseChain(many)).toBeNull();
    const sections = Array.from({ length: MAX_CHAINED_SECTIONS + 1 }, (_, i) =>
      note({ id: `n${i}`, at: i * 10, end: i * 10 + 5, chain: boosted() })
    );
    expect(parseFeedback(feedback({ notes: sections }))).toBeNull();
  });

  it('refuses two notes with one id', () => {
    expect(parseFeedback(feedback({ notes: [note(), note()] }))).toBeNull();
  });

  it('refuses a note past the end of the track, allowing a second of slack', () => {
    expect(
      parseFeedback(feedback({ notes: [note({ at: 200 })] }), 200.5)
    ).not.toBeNull();
    expect(
      parseFeedback(feedback({ notes: [note({ at: 230 })] }), 200)
    ).toBeNull();
    expect(
      parseFeedback(feedback({ notes: [note({ at: 190, end: 240 })] }), 200)
    ).toBeNull();
  });

  it('refuses what no page would send', () => {
    expect(parseFeedback(null)).toBeNull();
    expect(parseFeedback('feedback')).toBeNull();
    expect(parseFeedback({ ...feedback(), notes: 'many' })).toBeNull();
  });
});

describe('an empty set of tools', () => {
  it('is no tools, or an EQ whose points change nothing', () => {
    expect(chainIsEmpty(null)).toBe(true);
    expect(chainIsEmpty(emptyChain())).toBe(true);
    expect(chainIsEmpty({ ...emptyChain(), eq: [newBand('b', 'bell')] })).toBe(
      true
    );
    expect(
      chainIsEmpty({ ...emptyChain(), eq: [newBand('b', 'lowcut')] })
    ).toBe(false);
    expect(chainIsEmpty(boosted())).toBe(false);
  });
});
