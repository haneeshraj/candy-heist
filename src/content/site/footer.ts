// Copy and links for the site-wide footer (Figma "Footer R — Vortex Mask").
// The root layout passes this in as a prop, so a server-side loader (Server
// Action / database) can replace this module later without touching the
// component. Draft content until the client's intake answers arrive.

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
}

export const footerContent: FooterContent = {
  headline: { lead: 'Plan the next', statement: 'Heist.' },
  // Placeholder until the client confirms a bookings address.
  email: 'booking@candyheist.com',
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
    // Only Home exists so far; the rest are the planned routes.
    links: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Discography', href: '/discography' },
      { label: 'Sets', href: '/sets' },
      { label: 'Contact', href: '/contact' }
    ]
  },
  // Evaluated on the server, so the year updates with every build.
  copyright: `© ${new Date().getFullYear()} Candy Heist`
};
