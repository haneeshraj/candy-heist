import type { RefObject } from 'react';
import type { AboutContent } from '@/content/about/about';
import type { RevealBinder, RevealMap } from '../reveals';

export interface AboutJourneyProps {
  content: AboutContent;
  headingId: string;
  bind: RevealBinder;
  /** The sticky banner the journey ends in, faded in at the very end. */
  bannerRef: RefObject<HTMLElement | null>;
  reveals: RefObject<RevealMap>;
}

export interface PanelProps<Copy> {
  copy: Copy;
  bind: RevealBinder;
}
