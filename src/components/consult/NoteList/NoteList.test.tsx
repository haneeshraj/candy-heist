import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { consultCopy } from '@/content/consult/consult';
import { newBand, type Note } from '@/lib/consult/engine';
import NoteList from './NoteList';

const handlers = () => ({
  onAddMoment: vi.fn(),
  onAddSection: vi.fn(),
  onText: vi.fn(),
  onRemove: vi.fn(),
  onPick: vi.fn(),
  onTools: vi.fn()
});

const notes: Note[] = [
  {
    id: 'late',
    at: 80,
    end: 105,
    text: 'Too dark',
    chain: {
      devices: [
        {
          id: 'd1',
          kind: 'eq',
          on: true,
          bands: [{ ...newBand('b', 'bell'), gain: 3 }]
        }
      ]
    }
  },
  { id: 'early', at: 12, end: null, text: 'Nice intro', chain: null }
];

describe('NoteList', () => {
  it('lists the notes in the order they play, sections with their tools', () => {
    render(
      <NoteList
        copy={consultCopy.notes}
        notes={notes}
        activeId={null}
        marking={null}
        position={0}
        full={false}
        {...handlers()}
      />
    );
    const times = screen.getAllByRole('button', { name: /^\d+:\d\d/ });
    expect(times.map((time) => time.textContent)).toEqual([
      '0:12',
      '1:20–1:45'
    ]);
    expect(
      screen.getByRole('button', { name: /Tools · 1 on it/ })
    ).toBeInTheDocument();
  });

  it('adds a note at the playhead, or a section from what is marked', () => {
    const on = handlers();
    render(
      <NoteList
        copy={consultCopy.notes}
        notes={[]}
        activeId={null}
        marking={{ from: 80, to: 105 }}
        position={83}
        full={false}
        {...on}
      />
    );
    expect(screen.getByText(consultCopy.notes.empty)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '+ Note at 1:23' }));
    expect(on.onAddMoment).toHaveBeenCalledOnce();
    fireEvent.click(
      screen.getByRole('button', { name: '+ Section 1:20–1:45' })
    );
    expect(on.onAddSection).toHaveBeenCalledOnce();
  });

  it('writes, picks and removes a note', () => {
    const on = handlers();
    render(
      <NoteList
        copy={consultCopy.notes}
        notes={[notes[1]]}
        activeId={null}
        marking={null}
        position={0}
        full={false}
        {...on}
      />
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Nicer intro' }
    });
    expect(on.onText).toHaveBeenCalledWith('early', 'Nicer intro');
    fireEvent.click(screen.getByRole('button', { name: '0:12' }));
    expect(on.onPick).toHaveBeenCalledWith('early');
    fireEvent.click(
      screen.getByRole('button', { name: consultCopy.notes.remove })
    );
    expect(on.onRemove).toHaveBeenCalledWith('early');
  });

  it('stops adding once the send is full', () => {
    render(
      <NoteList
        copy={consultCopy.notes}
        notes={[]}
        activeId={null}
        marking={null}
        position={0}
        full
        {...handlers()}
      />
    );
    expect(screen.getByRole('button', { name: /Note at/ })).toBeDisabled();
    expect(screen.getByText(consultCopy.notes.full)).toBeInTheDocument();
  });
});
