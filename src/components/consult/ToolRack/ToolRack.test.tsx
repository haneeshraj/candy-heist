import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { consultCopy } from '@/content/consult/consult';
import {
  MAX_DEVICES,
  newDevice,
  startingChain,
  type Chain
} from '@/lib/consult/engine';
import ToolRack from './ToolRack';

const copy = consultCopy.tools;

const renderRack = (chain: Chain, onChange = vi.fn()) =>
  render(
    <ToolRack
      copy={copy}
      targets={[{ id: 'whole', label: copy.whole }]}
      target="whole"
      onTarget={vi.fn()}
      chain={chain}
      analyserRef={createRef<AnalyserNode>()}
      playing={false}
      onChange={onChange}
    />
  );

/** What the last change made the chain into, kind by kind. */
const kinds = (onChange: ReturnType<typeof vi.fn>) =>
  (onChange.mock.lastCall?.[0] as Chain).devices.map((d) => d.kind);

const eqAndWidth = (): Chain => ({
  devices: [newDevice('eq', 'd1'), newDevice('width', 'd2')]
});

describe('ToolRack', () => {
  // jsdom draws nothing; the EQ's picture is the browser's to test.
  beforeAll(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });

  it('starts with an EQ in the chain, open, and adds a device tapped in the palette', () => {
    const onChange = vi.fn();
    renderRack(startingChain('d1'), onChange);
    expect(
      screen.getByRole('heading', { name: 'EQ', level: 3 })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Dynamics/ }));
    expect(kinds(onChange)).toEqual(['eq', 'dynamics']);
  });

  it('adds a device dropped into the chain where it lands', () => {
    const onChange = vi.fn();
    renderRack(eqAndWidth(), onChange);
    const carrying = {
      types: ['application/x-consult-device'],
      getData: (type: string) =>
        type === 'application/x-consult-device' ? 'dynamics' : '',
      dropEffect: 'none'
    };
    const first = screen
      .getByRole('button', { name: /^EQ, No points/ })
      .closest('li');
    if (!first) throw new Error('no tile');
    // Over the first tile's left half: before it. jsdom's drag events
    // carry no pointer, so it's put on by hand.
    vi.spyOn(first, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(0, 0, 100, 60)
    );
    const over = createEvent.dragOver(first, { dataTransfer: carrying });
    Object.defineProperty(over, 'clientX', { value: 20 });
    fireEvent(first, over);
    fireEvent.drop(first, { dataTransfer: carrying });
    expect(kinds(onChange)).toEqual(['dynamics', 'eq', 'width']);

    // Over the last tile's far half: at the end of the chain.
    const slot = screen.getAllByRole('listitem').at(-1);
    if (!slot) throw new Error('no last tile');
    fireEvent.dragOver(slot, { dataTransfer: carrying });
    fireEvent.drop(slot, { dataTransfer: carrying });
    expect(kinds(onChange)).toEqual(['eq', 'width', 'dynamics']);
  });

  it('opens a device from its tile, moves it, and takes it away', () => {
    const onChange = vi.fn();
    renderRack(eqAndWidth(), onChange);
    fireEvent.click(
      screen.getByRole('button', { name: /^Stereo width, 120%/ })
    );
    expect(
      screen.getByText('120%', { selector: 'output' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: copy.devices.earlier }));
    expect(kinds(onChange)).toEqual(['width', 'eq']);

    fireEvent.click(screen.getByRole('button', { name: copy.remove }));
    expect(kinds(onChange)).toEqual(['eq']);
  });

  it('switches a device off from its light, keeping it in the chain', () => {
    const onChange = vi.fn();
    renderRack(eqAndWidth(), onChange);
    fireEvent.click(
      screen.getByRole('button', {
        name: `${'Stereo width'}: ${copy.devices.on}`
      })
    );
    const chain = onChange.mock.lastCall?.[0] as Chain;
    expect(chain.devices.map((d) => [d.kind, d.on])).toEqual([
      ['eq', true],
      ['width', false]
    ]);
  });

  it('stops taking devices at as many as a chain holds, and says so', () => {
    const onChange = vi.fn();
    renderRack(
      {
        devices: Array.from({ length: MAX_DEVICES }, (_, i) =>
          newDevice('eq', `d${i}`)
        )
      },
      onChange
    );
    expect(screen.getByText(copy.devices.full)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Dynamics/ }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('says how to put tools on a section before there is one', () => {
    renderRack(startingChain('d1'));
    expect(screen.getByText(copy.noSection)).toBeInTheDocument();
  });
});
