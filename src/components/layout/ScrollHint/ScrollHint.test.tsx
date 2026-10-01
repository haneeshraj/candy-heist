import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { systemCopy } from '@/content/site/system';
import { setAtPageEnd } from '@/lib/scroll/pageEnd';
import ScrollHint from './ScrollHint';

afterEach(() => setAtPageEnd(false));

describe('ScrollHint', () => {
  it('shows only while the page rests at its end', () => {
    const { container } = render(<ScrollHint copy={systemCopy.scrollHint} />);
    const hint = container.firstElementChild;
    expect(hint).not.toHaveAttribute('data-shown');
    expect(hint).toHaveAttribute('aria-hidden', 'true');

    act(() => setAtPageEnd(true));
    expect(hint).toHaveAttribute('data-shown');

    act(() => setAtPageEnd(false));
    expect(hint).not.toHaveAttribute('data-shown');
  });

  it('puts a word either side of the navbar', () => {
    render(<ScrollHint copy={systemCopy.scrollHint} />);
    expect(screen.getByText(systemCopy.scrollHint.lead)).toBeInTheDocument();
    expect(screen.getByText(systemCopy.scrollHint.trail)).toBeInTheDocument();
  });
});
