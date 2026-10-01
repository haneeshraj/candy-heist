// Copy and links for the site-wide footer (Figma "Footer R — Vortex Mask").
// The root layout passes this in as a prop, so a server-side loader (Server
// Action / database) can replace this module later without touching the
// component. Draft content until the client's intake answers arrive.

import { siteContact } from './contact';
import { socialLinks } from './socials';

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterLinkGroup {
  label: string;
  links: FooterLink[];
}

export interface FooterContent {
  /** Italic lead-in over the uppercased statement. */
  headline: { lead: string; statement: string };
  email: string;
  /** Poured into the vortex mark; pre-cropped to the Figma framing. */
  photo: { src: string; alt: string };
  follow: FooterLinkGroup;
  navigate: FooterLinkGroup;
  copyright: string;
  /** Beside the copyright. */
  terms: FooterLink;
}

export const footerContent: FooterContent = {
  headline: { lead: 'Plan the next', statement: 'Heist.' },
  email: siteContact.email,
  photo: {
    src: '/img/site/footer-photo.jpeg',
    alt: 'Candy Heist at the decks, seen through the vortex mark'
  },
  follow: {
    label: 'Follow',
    links: socialLinks
  },
  navigate: {
    label: 'Navigate',
    links: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Services', href: '/services' },
      { label: 'Discography', href: '/discography' },
      { label: 'Lore', href: '/lore' },
      { label: 'Contact', href: '/contact' }
    ]
  },
  // Evaluated on the server, so the year updates with every build.
  copyright: `© ${new Date().getFullYear()} Candy Heist`,
  terms: { label: 'Terms', href: '/terms' }
};
