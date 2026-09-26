import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ScrambleText from './ScrambleText';
import type { ScrambleTextHandle } from './ScrambleText.types';

const replaySpies: Array<ReturnType<typeof vi.fn>> = [];

vi.mock('use-scramble', () => ({
  useScramble: () => {
    const replay = vi.fn();
    replaySpies.push(replay);
    return { ref: { current: null }, replay };
  }
}));

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));
}

describe('ScrambleText', () => {
  beforeEach(() => {
    replaySpies.length = 0;
    mockMatchMedia(false);
  });

  it('renders the text as an accessible label, letter by letter', () => {
    render(<ScrambleText text="CANDY" trigger="manual" />);
    const wrapper = screen.getByLabelText('CANDY');
    expect(wrapper).toBeInTheDocument();
    expect(
      wrapper.querySelectorAll('[aria-hidden="true"]').length
    ).toBeGreaterThan(0);
  });

  it('skips the animation and resolves immediately when reduced motion is preferred', async () => {
    mockMatchMedia(true);
    const ref = createRef<ScrambleTextHandle>();
    const onComplete = vi.fn();
    render(
      <ScrambleText
        ref={ref}
        text="HI"
        trigger="manual"
        onComplete={onComplete}
      />
    );

    await ref.current?.play();

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("replays every letter's glyph scramble by default", async () => {
    const ref = createRef<ScrambleTextHandle>();
    render(
      <ScrambleText
        ref={ref}
        text="AB"
        trigger="manual"
        staggerDelay={0}
        letterDuration={0.02}
      />
    );

    await ref.current?.play();

    expect(replaySpies).toHaveLength(2);
    replaySpies.forEach((replay) => expect(replay).toHaveBeenCalled());
  });

  it("skips every letter's glyph scramble when scrambleEnabled is false", async () => {
    const ref = createRef<ScrambleTextHandle>();
    render(
      <ScrambleText
        ref={ref}
        text="AB"
        trigger="manual"
        scrambleEnabled={false}
        staggerDelay={0}
        letterDuration={0.02}
      />
    );

    await ref.current?.play();

    expect(replaySpies).toHaveLength(2);
    replaySpies.forEach((replay) => expect(replay).not.toHaveBeenCalled());
  });
});
