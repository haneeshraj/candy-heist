import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { consultCopy } from '@/content/consult/consult';
import { emptyChain, type Chain } from '@/lib/consult/engine';
import ToolRack from './ToolRack';

const renderRack = (chain: Chain, onChange = vi.fn(), extra = {}) =>
  render(
    <ToolRack
      copy={consultCopy.tools}
      targets={[{ id: 'whole', label: consultCopy.tools.whole }]}
      target="whole"
      onTarget={vi.fn()}
      chain={chain}
      bpm={124}
      analyserRef={createRef<AnalyserNode>()}
      playing={false}
      onChange={onChange}
      {...extra}
    />
  );

describe('ToolRack', () => {
  // jsdom draws nothing; the EQ's picture is the browser's to test.
  beforeAll(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });

  it('adds a sidechain at the track’s own tempo', () => {
    const onChange = vi.fn();
    renderRack(emptyChain(), onChange);
    const add = screen.getAllByRole('button', {
      name: `+ ${consultCopy.tools.add}`
    });
    // Saturation, sidechain, width, dynamics, in that order.
    fireEvent.click(add[1]);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        sidechain: expect.objectContaining({ bpm: 124, rate: '1/4' })
      })
    );
  });

  it('shows an added tool’s controls, and takes it away again', () => {
    const onChange = vi.fn();
    renderRack({ ...emptyChain(), width: { width: 1.5 } }, onChange);
    expect(screen.getByText('150%')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: consultCopy.tools.remove })
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ width: null })
    );
  });

  it('says how to put tools on a section before there is one', () => {
    renderRack(emptyChain());
    expect(screen.getByText(consultCopy.tools.noSection)).toBeInTheDocument();
  });
});
