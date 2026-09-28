import type { ElementType } from 'react';

export type WordRevealTrigger = 'mount' | 'inView' | 'manual';

export interface WordRevealProps {
  /** The real text. Rendered word by word, one animated span each. */
  text: string;
  /** Wrapping element/tag rendered around the words. @default 'span' */
  as?: ElementType;
  className?: string;
  /** Applied to every per-word inner span. */
  wordClassName?: string;
  /**
   * 'mount' plays as soon as the component mounts, 'inView' waits for the
   * wrapper to scroll into view, 'manual' waits for the imperative `play()`
   * (or `timeline()`) handle so a parent can orchestrate it.
   * @default 'mount'
   */
  trigger?: WordRevealTrigger;
  /** Seconds to wait before the first word starts (only applies to 'mount' / 'inView'). */
  startDelay?: number;
  /** Seconds between each word's start. @default 0.04 */
  staggerDelay?: number;
  /** Seconds each word's rise takes. @default 0.9 */
  wordDuration?: number;
  /** GSAP ease for the rise. @default the shared signature cubic-bezier */
  ease?: string;
  /** Skip the animation and render the final text immediately for prefers-reduced-motion. @default true */
  respectReducedMotion?: boolean;
  /** rootMargin/threshold for the 'inView' trigger. */
  inViewOptions?: IntersectionObserverInit;
  onStart?: () => void;
  onComplete?: () => void;
}

export interface WordRevealHandle {
  /** (re)plays the reveal from its hidden state and resolves when it finishes. */
  play: () => Promise<void>;
  /** Snaps every word back to its hidden, pre-reveal state. */
  reset: () => void;
  /**
   * Builds the reveal as a fresh timeline and hands it over, so a parent can
   * nest it (e.g. in a scroll-scrubbed timeline). The caller owns it: it
   * ignores startDelay, onStart and onComplete, and play() won't stop it.
   * With reduced motion it shows the final text and returns an empty timeline.
   */
  timeline: () => gsap.core.Timeline;
}
