// Copy and links for the site-wide navbar (Figma page "Navbar"). Like the
// footer, the root layout passes this in as a prop, so a server-side loader
// can replace this module later without touching the component.

import { socialLinks, type SocialLink } from './socials';

export interface NavbarLink {
  label: string;
  href: string;
}

export interface NavbarContent {
  /** The menu's heading and the navigation landmark's name. */
  menuLabel: string;
  /** Accessible names for the pill, which toggles the menu. */
  toggle: { open: string; close: string };
  links: NavbarLink[];
  socialsLabel: string;
  socials: SocialLink[];
  cta: NavbarLink;
  copyright: string;
  credit: string;
}

export const navbarContent: NavbarContent = {
  menuLabel: 'Menu',
  toggle: { open: 'Open menu', close: 'Close menu' },
  // Home and Sessions exist so far; the rest are the planned routes.
  links: [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Sessions', href: '/sessions' },
    { label: 'Discography', href: '/discography' },
    { label: 'Sets', href: '/sets' },
    { label: 'Contact', href: '/contact' }
  ],
  socialsLabel: 'Follow',
  socials: socialLinks,
  cta: { label: 'Book a session', href: '/sessions' },
  // Evaluated on the server, so the year updates with every build.
  copyright: `© ${new Date().getFullYear()} Candy Heist`,
  credit: 'Designed & developed by Haneesh Raj'
};
