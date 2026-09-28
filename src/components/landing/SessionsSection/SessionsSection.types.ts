import type { WordRevealHandle } from '@/components/common/WordReveal';
import type { SessionService, SessionsContent } from '@/content/home/sessions';

export interface SessionsSectionProps {
  content: SessionsContent;
}

/**
 * All the motion needs from a text component (ClipRevealText, ScrambleText
 * or WordReveal): its reveal as a timeline to nest and scrub.
 */
export type TextReveal = Pick<WordRevealHandle, 'timeline'>;

/** Every animated text in the section, filled in by the components' refs. */
export interface SessionsReveals {
  label: TextReveal | null;
  status: TextReveal | null;
  lead: TextReveal | null;
  statement: TextReveal | null;
  intro: TextReveal | null;
  /** By service index. */
  names: Array<TextReveal | null>;
  summaries: Array<TextReveal | null>;
}

export interface SessionsBackdropProps {
  photo: SessionsContent['photo'];
}

/** Stores a service's text reveal by its index. */
export type RegisterReveal = (index: number, reveal: TextReveal | null) => void;

export interface SessionsListProps {
  services: SessionService[];
  registerName: RegisterReveal;
  registerSummary: RegisterReveal;
}
