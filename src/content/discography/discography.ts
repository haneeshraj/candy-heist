import { z } from 'zod';
import copyData from './discography.json';

// The words around the catalogue: the discography page, a release's page
// and its share link page. Placeholders in braces ({date}, {platform}) are
// filled in by the components.

const text = z.string().trim().min(1);
const meta = z.object({ title: text, description: text });

export const discographyCopySchema = z.object({
  page: z.object({
    label: text,
    lead: text,
    statement: text,
    views: z.object({ label: text, vault: text, monument: text, index: text }),
    filters: z.object({
      button: text,
      region: text,
      sort: text,
      kind: text,
      year: text,
      sorts: z.object({ newest: text, oldest: text, title: text }),
      count: text,
      clear: text,
      remove: text,
      empty: text
    }),
    forthcoming: text,
    open: text,
    scroll: text,
    goTo: text,
    meta
  }),
  release: z.object({
    back: text,
    cover: text,
    canvas: text,
    viewArtwork: text,
    viewCanvas: text,
    close: text,
    pause: text,
    play: text,
    listenOn: text,
    platforms: text,
    out: text,
    presave: text,
    countdown: z.object({
      label: text,
      days: text,
      hours: text,
      minutes: text,
      seconds: text
    }),
    copyLink: text,
    copied: text,
    label: text,
    released: text,
    releaseDate: text,
    runningOrder: text,
    /** A track's page: "From {the release}". */
    from: text,
    /** A single's page: the albums that carry it. */
    alsoOn: text,
    featuring: text,
    moreSingles: text,
    moreCollections: text,
    artworkBy: text,
    canvasNote: text,
    meta: meta.extend({ track: text })
  }),
  share: z.object({
    home: text,
    presave: text,
    listen: text,
    copyright: text,
    copyrightUndated: text,
    meta: z.object({ title: text, out: text, soon: text })
  })
});

export type DiscographyCopy = z.infer<typeof discographyCopySchema>;

export const discographyCopy: DiscographyCopy =
  discographyCopySchema.parse(copyData);
