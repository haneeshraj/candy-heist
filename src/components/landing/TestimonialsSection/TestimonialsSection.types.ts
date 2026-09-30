import type { WordRevealHandle } from '@/components/common/WordReveal';
import type { TestimonialsContent } from '@/content/home/testimonials';

export interface TestimonialsSectionProps {
  content: TestimonialsContent;
}

/**
 * What the motion needs from a text component (ClipRevealText or
 * WordReveal): its reveal as a timeline to nest, or played on its own
 * after a reset (play() rises from wherever the words are).
 */
export type TextReveal = Pick<WordRevealHandle, 'timeline' | 'play' | 'reset'>;

/** Every animated text in the section, filled in by the components' refs. */
export interface TestimonialsReveals {
  label: TextReveal | null;
  lead: TextReveal | null;
  statement: TextReveal | null;
  /** One per quote, in order. */
  quotes: Array<TextReveal | null>;
}

export interface QuoteDotsProps {
  count: number;
  active: number;
  /** The dash is filling toward the next quote. */
  running: boolean;
  /** The visitor paused the rotation. */
  paused: boolean;
  /** Whether it rotates at all (not with reduced motion). */
  rotates: boolean;
  labels: TestimonialsContent['controls'];
  onSelect: (index: number) => void;
  /** The dash has filled: time for the next quote. */
  onElapsed: () => void;
  onTogglePause: () => void;
}
