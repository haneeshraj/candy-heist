import type { ElementType } from 'react';

export interface ScrambleTextScrambleOptions {
  /** 0-1 redraw rate. @default 0.6 */
  speed?: number;
  /** Frames between steps. @default 2 */
  tick?: number;
  /** Characters advanced per tick. @default 1 */
  step?: number;
  /** Chance (0-1) a given frame scrambles the character further. */
  chance?: number;
  /** How many random characters are tried before landing on the real one. @default 6 */
  scramble?: number;
  /** Random seed variety. @default 2 */
  seed?: number;
  /** Unicode range to draw random glyphs from. @default [65, 125] */
  range?: [number, number];
}

export type ScrambleTextTrigger = 'mount' | 'inView' | 'manual';

export interface ScrambleTextProps {
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
  trigger?: ScrambleTextTrigger;
  /** Seconds to wait before the first letter starts (only applies to 'mount' / 'inView'). */
  startDelay?: number;
  /** Seconds between each letter's start. @default 0.045 */
  staggerDelay?: number;
  /** Seconds each letter's slide-up takes. @default 0.9 */
  letterDuration?: number;
  /** GSAP ease name/string for the slide-up. @default the shared signature cubic-bezier */
  ease?: string;
  /** Whether each letter also runs its random-glyph flicker before landing on the real character, on top of the slide-up. Set false for a plain slide-up reveal with no scramble. @default true */
  scrambleEnabled?: boolean;
  /** Tuning for the use-scramble hook driving each letter's glyph flicker. */
  scramble?: ScrambleTextScrambleOptions;
  /** Skip the animation and render the final text immediately for prefers-reduced-motion. @default true */
  respectReducedMotion?: boolean;
  /** rootMargin/threshold for the 'inView' trigger. */
  inViewOptions?: IntersectionObserverInit;
  onStart?: () => void;
  onComplete?: () => void;
}

export interface ScrambleTextHandle {
  /** (re)plays the reveal from its hidden state and resolves when it finishes. */
  play: () => Promise<void>;
  /** Snaps every letter back to its hidden, pre-reveal state. */
  reset: () => void;
  /**
   * Builds the reveal as a fresh timeline and hands it over, so a parent can
   * nest it (e.g. in a scroll-scrubbed timeline). The caller owns it: it
   * ignores startDelay, onStart and onComplete, and play() won't stop it.
   * With reduced motion it shows the final text and returns an empty timeline.
   */
  timeline: () => gsap.core.Timeline;
}

export interface ScrambleLetterProps {
  char: string;
  index: number;
  className?: string;
  scrambleOptions?: ScrambleTextScrambleOptions;
  registerLetter: (
    index: number,
    node: HTMLSpanElement | null,
    replay: (() => void) | null
  ) => void;
}
