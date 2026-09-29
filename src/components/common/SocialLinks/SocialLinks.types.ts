import type { SocialLink } from '@/content/site/socials';

export interface SocialLinksProps {
  links: SocialLink[];
  /** The list's accessible name, e.g. "Listen to Candy Heist". */
  label: string;
  className?: string;
  /** Put on each item as `data-motion`, for a parent's animation. */
  itemMotion?: string;
}

export interface SocialSquareProps {
  social: SocialLink;
}
