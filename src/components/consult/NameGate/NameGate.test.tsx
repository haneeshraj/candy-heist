import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { consultCopy } from '@/content/consult/consult';
import NameGate from './NameGate';

const renderGate = (onStart = vi.fn()) =>
  render(
    <NameGate
      copy={consultCopy.gate}
      label={consultCopy.label}
      title="Menace"
      message="Is the drop too dark?"
      fromLabel={consultCopy.room.from}
      left="Open for 3 days"
      onStart={onStart}
    />
  );

describe('NameGate', () => {
  it('shows the track, Candy’s question and how long the link is open', () => {
    renderGate();
    expect(screen.getByRole('heading', { name: 'Menace' })).toBeInTheDocument();
    expect(screen.getByText('Is the drop too dark?')).toBeInTheDocument();
    expect(screen.getByText('Open for 3 days')).toBeInTheDocument();
  });

  it('waits for a name, then starts with it trimmed', () => {
    const onStart = vi.fn();
    renderGate(onStart);
    const start = screen.getByRole('button', { name: consultCopy.gate.start });
    expect(start).toBeDisabled();
    fireEvent.change(
      screen.getByLabelText(new RegExp(consultCopy.gate.name.label)),
      {
        target: { value: '  Nasko  ' }
      }
    );
    expect(start).toBeEnabled();
    fireEvent.click(start);
    expect(onStart).toHaveBeenCalledWith('Nasko');
  });
});
