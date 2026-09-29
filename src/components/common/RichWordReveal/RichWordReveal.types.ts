import type { ElementType } from 'react';

export interface RichWordRevealSegment {
  text: string;
  /** Set with `emphasisClassName` (the accent italic, say). */
  emphasis?: boolean;
  /** Set with `placeholderClassName` (copy still to come, say). */
  placeholder?: boolean;
}

export interface RichWordRevealProps {
  /** The copy, run by run. Spaces between runs are kept as written. */
  segments: RichWordRevealSegment[];
  /** Wrapping element. @default 'p' */
  as?: ElementType;
  className?: string;
  emphasisClassName?: string;
  placeholderClassName?: string;
  /** Seconds between each word's start, across all the runs. @default 0.04 */
  staggerDelay?: number;
  /** Seconds each word's rise takes. @default 0.9 */
  wordDuration?: number;
}

// The same handle as WordReveal's, so a parent can drive either.
export interface RichWordRevealHandle {
  /** Plays the whole reveal and resolves when it finishes. */
  play: () => Promise<void>;
  /** Snaps every word back to its hidden, pre-reveal state. */
  reset: () => void;
  /**
   * Builds the reveal as a fresh timeline for a parent to nest (e.g. in a
   * scroll-scrubbed timeline). With reduced motion it shows the final text
   * and returns an empty timeline.
   */
  timeline: () => gsap.core.Timeline;
}
