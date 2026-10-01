import { z } from 'zod';
import previewData from './preview.json';

// The words on the link previews (the images shown when a page is shared):
// the site's own card, and a release's. Strings with {braces} are filled
// in per release.

const text = z.string().trim().min(1);

export const previewCopySchema = z.object({
  site: z.object({
    lead: text,
    statement: text,
    line: text,
    foot: text,
    alt: text
  }),
  release: z.object({
    out: text,
    forthcoming: text,
    track: text,
    from: text,
    listen: text,
    presave: text,
    alt: text
  })
});

export type PreviewCopy = z.infer<typeof previewCopySchema>;

export const previewCopy: PreviewCopy = previewCopySchema.parse(previewData);
