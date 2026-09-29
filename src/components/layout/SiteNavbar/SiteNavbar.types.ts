import type { Ref } from 'react';
import type { NavbarContent, NavbarLink } from '@/content/site/navbar';
import type { SocialLink } from '@/content/site/socials';

export interface SiteNavbarProps {
  content: NavbarContent;
}

export interface NavbarPillProps {
  ref?: Ref<HTMLButtonElement>;
  /** Shown in the middle block: the page you're on, or the menu label while open. */
  label: string;
  open: boolean;
  panelId: string;
  accessibleName: string;
  onToggle: () => void;
}

export interface NavbarPanelProps {
  ref?: Ref<HTMLElement>;
  id: string;
  content: NavbarContent;
  /** href of the link for the page you're on, if it's in the menu. */
  activeHref?: string;
  /** Called when a link in the menu is followed, to close it. */
  onNavigate: () => void;
}

export interface NavbarLinkProps {
  link: NavbarLink;
  current: boolean;
  onNavigate: () => void;
}

export interface NavbarSocialProps {
  social: SocialLink;
  /** Seconds before it pops in. */
  delay: number;
}
