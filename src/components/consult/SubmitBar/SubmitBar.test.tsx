import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { consultCopy } from '@/content/consult/consult';
import SubmitBar from './SubmitBar';

describe('SubmitBar', () => {
  it('says why there is nothing to send yet, and won’t send it', () => {
    render(
      <SubmitBar
        copy={consultCopy.submit}
        noteCount={0}
        toolCount={0}
        sending={false}
        onSend={vi.fn()}
      />
    );
    expect(screen.getByText(consultCopy.submit.nothing)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: consultCopy.submit.send })
    ).toBeDisabled();
  });

  it('says what is going, then sends it', () => {
    const onSend = vi.fn();
    render(
      <SubmitBar
        copy={consultCopy.submit}
        noteCount={3}
        toolCount={1}
        sending={false}
        onSend={onSend}
      />
    );
    expect(screen.getByText('3 notes and 1 set of tools')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: consultCopy.submit.send })
    );
    expect(onSend).toHaveBeenCalledOnce();
  });

  it('holds while sending', () => {
    render(
      <SubmitBar
        copy={consultCopy.submit}
        noteCount={1}
        toolCount={0}
        sending
        onSend={vi.fn()}
      />
    );
    expect(
      screen.getByRole('button', { name: consultCopy.submit.sending })
    ).toBeDisabled();
  });
});
