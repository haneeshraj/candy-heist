// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  MAX_CHAINED_SECTIONS,
  MAX_DEVICES,
  MAX_EQ_BANDS,
  chainIsEmpty,
  deviceTitle,
  emptyChain,
  newBand,
  newDevice,
  newDynamics,
  startingChain,
  type Chain,
  type Device,
  type EqBand,
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

const eq = (id: string, ...bands: EqBand[]): Device => ({
  id,
  kind: 'eq',
  on: true,
  bands
});

const boosted = (): Chain => ({
  devices: [eq('d1', { ...newBand('b1', 'bell', 1500), gain: 4 })]
});

describe('feedback as it arrives', () => {
  it('takes a note at a moment', () => {
    expect(parseFeedback(feedback())).toEqual(feedback());
  });

  it('takes a section with tools on it, and tools on the whole song', () => {
    const sent = feedback({
      notes: [note({ end: 105, chain: boosted() })],
      chain: {
        devices: [
          {
            id: 'd2',
            kind: 'dynamics',
            on: true,
            dynamics: newDynamics('limiter')
          }
        ]
      }
    });
    expect(parseFeedback(sent)).toEqual(sent);
  });

  it('takes two EQs, in the order they were laid, one of them switched off', () => {
    const chain: Chain = {
      devices: [
        eq('d1', { ...newBand('b1', 'highshelf'), gain: 3 }),
        { id: 'd2', kind: 'width', on: false, width: { width: 1.4 } },
        eq('d3', newBand('b2', 'lowcut'))
      ]
    };
    expect(parseChain(chain)).toEqual(chain);
    expect(deviceTitle(chain, chain.devices[2])).toBe('EQ 2');
    expect(deviceTitle(chain, chain.devices[0])).toBe('EQ');
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
    // An EQ with no points, as every chain starts, is no tool.
    expect(
      parseFeedback(feedback({ notes: [], chain: startingChain('d1') }))
    ).toBeNull();
  });

  it('refuses a value outside its range', () => {
    const loud: Chain = {
      devices: [eq('d1', { ...newBand('b1', 'bell'), gain: 40 })]
    };
    expect(parseFeedback(feedback({ notes: [], chain: loud }))).toBeNull();
    const wide: Chain = {
      devices: [{ id: 'd1', kind: 'width', on: true, width: { width: 9 } }]
    };
    expect(parseFeedback(feedback({ notes: [], chain: wide }))).toBeNull();
  });

  it('caps the points, the devices, and the sections with tools', () => {
    const many: Chain = {
      devices: [
        eq(
          'd1',
          ...Array.from({ length: MAX_EQ_BANDS + 1 }, (_, i) =>
            newBand(`b${i}`, 'notch', 200 + i * 100)
          )
        )
      ]
    };
    expect(parseChain(many)).toBeNull();
    const crowded: Chain = {
      devices: Array.from({ length: MAX_DEVICES + 1 }, (_, i) =>
        newDevice('dynamics', `d${i}`)
      )
    };
    expect(parseChain(crowded)).toBeNull();
    const sections = Array.from({ length: MAX_CHAINED_SECTIONS + 1 }, (_, i) =>
      note({ id: `n${i}`, at: i * 10, end: i * 10 + 5, chain: boosted() })
    );
    expect(parseFeedback(feedback({ notes: sections }))).toBeNull();
  });

  it('refuses two notes, two devices or two points with one id', () => {
    expect(parseFeedback(feedback({ notes: [note(), note()] }))).toBeNull();
    expect(
      parseChain({ devices: [newDevice('width', 'd1'), newDevice('eq', 'd1')] })
    ).toBeNull();
    expect(
      parseChain({
        devices: [eq('d1', newBand('b1', 'bell'), newBand('b1', 'notch'))]
      })
    ).toBeNull();
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
    expect(
      parseChain({ devices: [{ id: 'd1', kind: 'saturation', on: true }] })
    ).toBeNull();
  });
});

describe('a chain stored before devices', () => {
  const old = {
    eq: [{ ...newBand('b1', 'bell', 1500), gain: 4 }],
    saturation: { drive: 6, mix: 0.5, output: 0 },
    sidechain: { bpm: 124, rate: '1/4', depth: 0.6, release: 0.6, offset: 0 },
    width: { width: 1.3 },
    dynamics: newDynamics('compressor')
  };

  it('comes in as devices, in the order it was heard, with saturation and the sidechain left out', () => {
    expect(parseChain(old)).toEqual({
      devices: [
        { id: 'eq', kind: 'eq', on: true, bands: old.eq },
        { id: 'width', kind: 'width', on: true, width: { width: 1.3 } },
        { id: 'dynamics', kind: 'dynamics', on: true, dynamics: old.dynamics }
      ]
    });
  });

  it('leaves out an EQ with no points, and anything not there', () => {
    expect(
      parseChain({
        eq: [],
        saturation: null,
        sidechain: null,
        width: null,
        dynamics: null
      })
    ).toEqual(emptyChain());
  });

  it('reads in old feedback, sections and all', () => {
    const read = parseFeedback({
      name: 'Nasko',
      notes: [{ id: 'n1', at: 10, end: 20, text: '', chain: old }],
      chain: { ...old, dynamics: null }
    });
    expect(read?.notes[0].chain?.devices.map((d) => d.kind)).toEqual([
      'eq',
      'width',
      'dynamics'
    ]);
    expect(read?.chain?.devices.map((d) => d.kind)).toEqual(['eq', 'width']);
  });
});

describe('an empty set of tools', () => {
  it('is no devices, or only ones that leave the sound as it is', () => {
    expect(chainIsEmpty(null)).toBe(true);
    expect(chainIsEmpty(emptyChain())).toBe(true);
    expect(chainIsEmpty(startingChain('d1'))).toBe(true);
    expect(chainIsEmpty({ devices: [eq('d1', newBand('b', 'bell'))] })).toBe(
      true
    );
    expect(
      chainIsEmpty({
        devices: [{ id: 'd1', kind: 'width', on: true, width: { width: 1 } }]
      })
    ).toBe(true);
    expect(chainIsEmpty({ devices: [eq('d1', newBand('b', 'lowcut'))] })).toBe(
      false
    );
    expect(chainIsEmpty({ devices: [newDevice('dynamics', 'd1')] })).toBe(
      false
    );
    expect(chainIsEmpty(boosted())).toBe(false);
  });

  it('counts a device switched off as what he set', () => {
    const off = boosted();
    off.devices[0].on = false;
    expect(chainIsEmpty(off)).toBe(false);
  });
});
