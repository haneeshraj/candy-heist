import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { consultCopy } from '@/content/consult/consult';
import TrackStage from './TrackStage';
import type { TrackStageProps } from './TrackStage.types';

const renderStage = (extra: Partial<TrackStageProps> = {}) =>
  render(
    <TrackStage
      copy={consultCopy.room}
      waveform={new Uint8Array(300)}
      duration={200}
      positionRef={{ current: 0 }}
      second={0}
      playing={false}
      failed={false}
      notes={[]}
      activeId={null}
      marking={null}
      bypass={false}
      canCompare
      onBypass={vi.fn()}
      onToggle={vi.fn()}
      onSeek={vi.fn()}
      onMark={vi.fn()}
      onPick={vi.fn()}
      {...extra}
    />
  );

describe('TrackStage', () => {
  // jsdom draws nothing; the waveform's picture is the browser's to test.
  beforeAll(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });

  it('hears it as it is, and with his tools again, from beside the play button', () => {
    const onBypass = vi.fn();
    renderStage({ onBypass });
    const asItIs = screen.getByRole('button', {
      name: consultCopy.room.asItIs
    });
    const withTools = screen.getByRole('button', {
      name: consultCopy.room.withTools
    });
    expect(withTools).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(asItIs);
    expect(onBypass).toHaveBeenLastCalledWith(true);
    fireEvent.click(withTools);
    expect(onBypass).toHaveBeenLastCalledWith(false);
  });

  it('lights the half that is heard', () => {
    renderStage({ bypass: true });
    expect(
      screen.getByRole('button', { name: consultCopy.room.asItIs })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: consultCopy.room.withTools })
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('has no before and after until a tool is on, and says why', () => {
    renderStage({ canCompare: false });
    const group = screen.getByRole('group', {
      name: consultCopy.room.compare
    });
    expect(group).toHaveAttribute('title', consultCopy.room.compareHint);
    for (const name of [consultCopy.room.asItIs, consultCopy.room.withTools])
      expect(screen.getByRole('button', { name })).toBeDisabled();
  });
});
