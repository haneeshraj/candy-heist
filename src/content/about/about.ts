import { z } from 'zod';
import { socialLinks, type SocialLink } from '@/content/site/socials';
import aboutData from './about.json';

// The About page, top to bottom: the intro, who he is, the world of Nayara,
// behind the signal (the three roles) and the signal continues. Plain JSON
// checked against this schema, so a server-side loader can hand over the
// same shape later without touching the components.
//
// Dummy copy until the client sends his: the storyboard's words, with
// every fact still missing marked "[From Candy: …]" (a placeholder
// segment, set dimmer on the page).

const text = z.string().trim().min(1);

// A run of copy: plain, in the accent italic, or a placeholder.
const segment = z.object({
  text: z.string().min(1),
  /** Set in the accent italic (Cormorant Garamond, gilt). */
  emphasis: z.boolean().optional(),
  /** Stands in for copy the client hasn't sent yet; set dimmer. */
  placeholder: z.boolean().optional()
});
const rich = z.array(segment).min(1);

const photo = z.object({
  src: text,
  /** Empty for a decorative photo. */
  alt: z.string(),
  /** Where the crop centres (% of the photo) and how far it's zoomed in. */
  focus: z
    .object({
      x: z.number().min(0).max(100),
      y: z.number().min(0).max(100),
      zoom: z.number().min(1)
    })
    .optional()
});

const readout = z.object({ label: text, value: text, detail: text });
const link = z.object({ label: text, href: text });

export const aboutSchema = z.object({
  intro: z.object({
    /** Italic lead-in over the uppercased statement. */
    lead: text,
    statement: text,
    sub: text,
    cue: text
  }),
  who: z.object({
    label: text,
    body: rich,
    secondary: text,
    photo,
    lock: text,
    /** Two, on the instrument's left: where he's from, where he is. */
    readouts: z.tuple([readout, readout]),
    since: text,
    /** The accessible name of the streaming links. */
    streamingLabel: text,
    /** Platforms from the site's socials, in order. */
    streaming: z
      .array(z.enum(['instagram', 'soundcloud', 'spotify', 'youtube']))
      .min(1)
  }),
  nayara: z.object({
    label: text,
    lead: text,
    /** Uppercased, in two lines: the "\n" is where it breaks. */
    statement: text,
    body: text,
    /** Replace the who readouts, slot for slot. */
    readouts: z.tuple([readout, readout]),
    cta: link
  }),
  behind: z.object({
    label: text,
    headline: text,
    paragraphs: z.array(rich).min(1),
    roles: z
      .array(z.object({ title: text, body: text, note: rich, photo }))
      .min(1)
  }),
  continues: z.object({
    label: text,
    headline: text,
    lede: text,
    paragraphs: z.array(rich).min(1),
    closing: text,
    banner: z.object({ name: text, photo }),
    listen: link,
    contact: link
  })
});

export type AboutCopy = z.infer<typeof aboutSchema>;
export type AboutRichText = z.infer<typeof rich>;
export type AboutPhoto = z.infer<typeof photo>;
export type AboutReadout = z.infer<typeof readout>;
export type AboutRole = AboutCopy['behind']['roles'][number];

export type AboutContent = AboutCopy & {
  /** The streaming platforms' links, looked up from the site's socials. */
  streaming: SocialLink[];
};

const copy = aboutSchema.parse(aboutData);

export const aboutContent: AboutContent = {
  ...copy,
  streaming: copy.who.streaming.flatMap((platform) =>
    socialLinks.filter((social) => social.platform === platform)
  )
};
