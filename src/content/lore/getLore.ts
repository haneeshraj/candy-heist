import 'server-only';
import { cache } from 'react';
import { readPublishedLore } from '@/lib/lore/published';
import { loadLore } from './loadLore';
import copy from './lore.json';
import {
  chapterSchema,
  loreSchema,
  withNumerals,
  type LoreContent
} from './lore';
import { parseLoreMarkdown } from './markdown';

// The lore the pages show. Until Candy Haven publishes a chapter, the
// files in chapters/; from the first publish on, only what Haven has
// published, in its order: Haven's lore replaces the files whole, so a
// half-published lore never mixes with the old one.
//
// A published chapter that can't be read (it shouldn't happen: publishing
// checks the text) is left out rather than taking the lore down with it.
export const getLore = cache(async (): Promise<LoreContent> => {
  const published = await readPublishedLore();
  if (!published) return loadLore();

  const chapters = published.chapters.flatMap((chapter) => {
    try {
      const parsed = chapterSchema.safeParse({
        slug: chapter.slug,
        title: chapter.title,
        line: chapter.line,
        planet: chapter.planet,
        blocks: parseLoreMarkdown(chapter.body)
      });
      if (parsed.success) return [parsed.data];
      console.error(
        `Lore chapter "${chapter.slug}" can't be shown.`,
        parsed.error.issues
      );
    } catch (error) {
      console.error(`Lore chapter "${chapter.slug}" can't be shown.`, error);
    }
    return [];
  });
  return withNumerals(loreSchema.parse({ ...copy, chapters }));
});
