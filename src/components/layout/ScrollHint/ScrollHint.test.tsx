import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { setAtPageEnd } from '@/lib/scroll/pageEnd';
import ScrollHint from './ScrollHint';

afterEach(() => setAtPageEnd(false));

describe('ScrollHint', () => {
  it('shows only while the page rests at its end', () => {
    const { container } = render(<ScrollHint />);
    const hint = container.firstElementChild;
    expect(hint).not.toHaveAttribute('data-shown');
    expect(hint).toHaveAttribute('aria-hidden', 'true');

    act(() => setAtPageEnd(true));
    expect(hint).toHaveAttribute('data-shown');

    act(() => setAtPageEnd(false));
    expect(hint).not.toHaveAttribute('data-shown');
  });
});
