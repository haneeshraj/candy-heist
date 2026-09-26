import type { ElementType } from 'react';

export type ClipRevealTextTrigger = 'mount' | 'inView' | 'manual';

export interface ClipRevealTextProps {
  /** The real text. Rendered letter-by-letter, one animated span each. */
  text: string;
  /** Wrapping element/tag rendered around the letters. @default 'span' */
  as?: ElementType;
  className?: string;
  /** Applied to every per-letter inner span, in addition to the wrapper's inherited styles. */
  letterClassName?: string;
  /**
   * 'mount' plays as soon as the component mounts, 'inView' waits for the
   * wrapper to scroll into view, 'manual' waits for the imperative `play()`
   * handle so a parent can orchestrate multiple components in sequence.
   * @default 'mount'
   */
  trigger?: ClipRevealTextTrigger;
  /** Seconds to wait before the sweep starts (only applies to 'mount' / 'inView'). */
  startDelay?: number;
  /** Seconds between each letter's start. @default 0.05 */
  staggerDelay?: number;
  /** Seconds each letter's slide-up takes; also the duration of the wipe's initial grow-in from the left edge. @default 0.6 */
  letterDuration?: number;
  /** GSAP ease for both the letter slide-up and the wipe sweep. @default the shared signature cubic-bezier */
  ease?: string;
  /** Solid color the wipe block sweeps in. @default 'var(--color-cream)' */
  wipeColor?: string;
  /** Skip the animation and render the final text immediately for prefers-reduced-motion. @default true */
  respectReducedMotion?: boolean;
  /** rootMargin/threshold for the 'inView' trigger. */
  inViewOptions?: IntersectionObserverInit;
  onStart?: () => void;
  onComplete?: () => void;
}

export interface ClipRevealTextHandle {
  /** (re)plays the reveal from its hidden state and resolves when it finishes. */
  play: () => Promise<void>;
  /** Snaps the wipe back to fully-covered and letters back to hidden. */
  reset: () => void;
}
