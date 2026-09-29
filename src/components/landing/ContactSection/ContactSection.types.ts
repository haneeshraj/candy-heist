import type { WordRevealHandle } from '@/components/common/WordReveal';
import type { ContactContent } from '@/content/home/contact';

export interface ContactSectionProps {
  content: ContactContent;
}

/**
 * All the motion needs from a text component (ClipRevealText, ScrambleText
 * or WordReveal): its reveal as a timeline to nest and scrub.
 */
export type TextReveal = Pick<WordRevealHandle, 'timeline'>;

/** Every animated text in the section, filled in by the components' refs. */
export interface ContactReveals {
  label: TextReveal | null;
  lead: TextReveal | null;
  statement: TextReveal | null;
  intro: TextReveal | null;
}
