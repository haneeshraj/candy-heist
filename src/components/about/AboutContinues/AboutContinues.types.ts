import type { RefObject } from 'react';
import type { AboutContent } from '@/content/about/about';
import type { RevealBinder, RevealMap } from '../reveals';

export interface AboutContinuesProps {
  content: AboutContent;
  bind: RevealBinder;
  reveals: RefObject<RevealMap>;
  /** The page's sticky banner, which settles as this scrolls in. */
  bannerRef: RefObject<HTMLElement | null>;
}
