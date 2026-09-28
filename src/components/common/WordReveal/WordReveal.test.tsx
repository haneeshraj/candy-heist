import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WordReveal from './WordReveal';
import type { WordRevealHandle } from './WordReveal.types';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));
}

describe('WordReveal', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it('reads as one phrase and animates one span per word', () => {
    const { container } = render(
      <WordReveal as="p" text="From your first blend" trigger="manual" />
    );
    expect(screen.getByText('From your first blend')).toBeInTheDocument();
    const visual = container.querySelector('[aria-hidden="true"]');
    expect(visual?.textContent).toBe('From your first blend');
    expect(visual?.children).toHaveLength(4);
  });

  it('skips the animation and resolves immediately when reduced motion is preferred', async () => {
    mockMatchMedia(true);
    const ref = createRef<WordRevealHandle>();
    const onComplete = vi.fn();
    render(
      <WordReveal
        ref={ref}
        text="Two words"
        trigger="manual"
        onComplete={onComplete}
      />
    );

    await ref.current?.play();

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(ref.current?.timeline().getChildren()).toHaveLength(0);
  });

  it('exposes play()/reset() and a timeline() a parent can nest', async () => {
    const ref = createRef<WordRevealHandle>();
    render(
      <WordReveal
        ref={ref}
        text="Two words"
        trigger="manual"
        staggerDelay={0}
        wordDuration={0.01}
      />
    );

    await expect(ref.current?.play()).resolves.toBeUndefined();
    expect(() => ref.current?.reset()).not.toThrow();
    expect(ref.current?.timeline().getChildren()).toHaveLength(2);
  });
});
