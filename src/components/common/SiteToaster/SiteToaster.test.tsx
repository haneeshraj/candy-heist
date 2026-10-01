import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { systemCopy } from '@/content/site/system';
import { notifyError, notifySuccess } from '@/lib/toast/notify';
import SiteToaster from './SiteToaster';

// sonner captures the pointer for its swipe; jsdom has no pointer capture.
beforeAll(() => {
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
});

describe('SiteToaster', () => {
  it('shows a success, with a way to close it', async () => {
    render(<SiteToaster copy={systemCopy.toast} />);
    act(() => {
      notifySuccess('Copied booking@candyheist.com');
    });
    expect(
      await screen.findByText('Copied booking@candyheist.com')
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: systemCopy.toast.close }).length
    ).toBeGreaterThan(0);
  });

  it('shows an error with what to do, and its action', async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    render(<SiteToaster copy={systemCopy.toast} />);
    act(() => {
      notifyError('The payment didn’t go through', 'Nothing was charged.', {
        label: 'Try again',
        onClick: retry
      });
    });
    expect(
      await screen.findByText('The payment didn’t go through')
    ).toBeInTheDocument();
    expect(screen.getByText('Nothing was charged.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalled();
  });
});
