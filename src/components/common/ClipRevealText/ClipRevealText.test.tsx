import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ClipRevealText from './ClipRevealText';
import type { ClipRevealTextHandle } from './ClipRevealText.types';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));
}

describe('ClipRevealText', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it('renders the text as an accessible label, letter by letter', () => {
    render(<ClipRevealText text="EST. 2018" trigger="manual" />);
    const wrapper = screen.getByLabelText('EST. 2018');
    expect(wrapper).toBeInTheDocument();
    expect(
      wrapper.querySelectorAll('[aria-hidden="true"]').length
    ).toBeGreaterThan(0);
  });

  it('skips the animation and resolves immediately when reduced motion is preferred', async () => {
    mockMatchMedia(true);
    const ref = createRef<ClipRevealTextHandle>();
    const onComplete = vi.fn();
    render(
      <ClipRevealText
        ref={ref}
        text="HI"
        trigger="manual"
        onComplete={onComplete}
      />
    );

    await ref.current?.play();

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('exposes an imperative play()/reset() handle', async () => {
    const ref = createRef<ClipRevealTextHandle>();
    render(
      <ClipRevealText
        ref={ref}
        text="HI"
        trigger="manual"
        staggerDelay={0}
        letterDuration={0.01}
      />
    );

    expect(ref.current).not.toBeNull();
    await expect(ref.current?.play()).resolves.toBeUndefined();
    expect(() => ref.current?.reset()).not.toThrow();
  });

  it('hands a parent the reveal as a timeline: the wipe in and out, then each letter', () => {
    const ref = createRef<ClipRevealTextHandle>();
    render(<ClipRevealText ref={ref} text="HI" trigger="manual" />);

    expect(ref.current?.timeline().getChildren()).toHaveLength(4);
  });

  it('returns an empty timeline when reduced motion is preferred', () => {
    mockMatchMedia(true);
    const ref = createRef<ClipRevealTextHandle>();
    render(<ClipRevealText ref={ref} text="HI" trigger="manual" />);

    expect(ref.current?.timeline().getChildren()).toHaveLength(0);
  });
});
