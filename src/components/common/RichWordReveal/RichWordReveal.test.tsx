import { createRef } from 'react';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RichWordReveal from './RichWordReveal';
import type { RichWordRevealHandle } from './RichWordReveal.types';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));
}

const SEGMENTS = [
  { text: 'Candy Heist ' },
  { text: 'builds rooms that remember', emphasis: true },
  { text: '. Every set.' }
];

describe('RichWordReveal', () => {
  beforeEach(() => mockMatchMedia(false));

  it('keeps the copy’s own spacing between runs', () => {
    const { container } = render(
      <RichWordReveal segments={SEGMENTS} emphasisClassName="em" />
    );
    const paragraph = container.querySelector('p');
    // Each run's plain copy, as assistive tech reads it.
    const read = Array.from(
      container.querySelectorAll('p > span > span:first-child')
    ).map((span) => span.textContent);
    expect(read).toEqual(SEGMENTS.map((segment) => segment.text));
    // A space where the copy has one at the seam, none before the full stop.
    const seams = Array.from(paragraph?.childNodes ?? []).filter(
      (node) => node.nodeType === Node.TEXT_NODE
    );
    expect(seams.map((node) => node.textContent)).toEqual([' ']);
    expect(container.querySelector('.em')).not.toBeNull();
  });

  it('nests every run’s words in one timeline', () => {
    const ref = createRef<RichWordRevealHandle>();
    render(<RichWordReveal ref={ref} segments={SEGMENTS} />);
    // One nested timeline per run.
    expect(ref.current?.timeline().getChildren(false)).toHaveLength(3);
  });

  it('shows the final text at once with reduced motion', async () => {
    mockMatchMedia(true);
    const ref = createRef<RichWordRevealHandle>();
    render(<RichWordReveal ref={ref} segments={SEGMENTS} />);
    await expect(ref.current?.play()).resolves.toBeUndefined();
  });
});
