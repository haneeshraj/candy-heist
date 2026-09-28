// Copy for the home page About section. The page passes this in as a prop,
// so a server-side loader (Server Action / database) can replace this
// module later without touching the component. Draft copy until the
// client's intake answers arrive.

export interface RichTextSegment {
  text: string;
  /** Set in the accent italic (Cormorant Garamond, gilt). */
  emphasis?: boolean;
}

export interface AboutHeadlineHalf {
  /** Italic lead-in, e.g. "The sets of". */
  lead: string;
  /** Uppercased statement, e.g. "Candy Heist". */
  statement: string;
}

export interface AboutFact {
  label: string;
  /** One entry per line the value should break onto. */
  value: string[];
}

export interface AboutContent {
  label: string;
  /** Mirrored across the arch; read together as one sentence. */
  headline: { left: AboutHeadlineHalf; right: AboutHeadlineHalf };
  facts: { left: AboutFact[]; right: AboutFact[] };
  photo: { src: string; alt: string };
  body: RichTextSegment[];
  aside: string;
  cta: { label: string; href: string };
}

export const aboutContent: AboutContent = {
  label: 'About',
  headline: {
    left: { lead: 'The sets of', statement: 'Candy Heist' },
    right: { lead: 'are acts of', statement: 'Remembrance.' }
  },
  facts: {
    left: [
      { label: 'Origin', value: ['Kerala, India'] },
      // Non-breaking space: on narrow screens this breaks after the comma.
      { label: 'Based in', value: ['Halifax, Nova Scotia'] }
    ],
    right: [
      { label: 'Discipline', value: ['DJ · Producer', 'Sound Engineer'] },
      { label: 'Established', value: ['2018'] }
    ]
  },
  photo: {
    src: '/img/home/about-photo.jpeg',
    alt: 'Candy Heist at the decks beneath the vaulted, crimson-lit ceiling of a gothic hall'
  },
  body: [
    {
      text: 'Somewhere between tech house bounce and dubstep intensity, Candy Heist '
    },
    { text: 'builds rooms that remember', emphasis: true },
    {
      text: ". Every set is part ritual, part signal, tuned to give back something the crowd didn't know it had lost."
    }
  ],
  aside:
    'Off the decks he is a producer and sound engineer, which is why every Candy Heist set is built from the ground up. Kerala-born and Halifax-based, he has been shaping that sound since 2018.',
  cta: { label: 'More about me', href: '/about' }
};
