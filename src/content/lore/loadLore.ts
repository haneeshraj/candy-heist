import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import copy from './lore.json';
import { loreSchema, withNumerals, type LoreContent } from './lore';
import {
  LoreMarkdownError,
  parseLoreMarkdown,
  splitFrontmatter
} from './markdown';

// Reads the lore for the pages, on the server: the copy, and every
// chapter file in chapters/ in the order their numbers give. A chapter's
// file is named "<number>-<slug>.md" (01-the-planet.md); its frontmatter
// holds the title, the line, the planet's look and any render, and the
// rest is its text in markdown. A Candy Haven loader would read the same
// fields and the same markdown from its database, through chapterFrom.

const CHAPTERS = path.join(process.cwd(), 'src/content/lore/chapters');
const FILE_NAME = /^(\d+)-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;

/** One chapter, from its slug and its markdown (frontmatter and text). */
export function chapterFrom(slug: string, markdown: string) {
  const { data, body } = splitFrontmatter(markdown);
  return {
    ...(data as Record<string, unknown>),
    slug,
    blocks: parseLoreMarkdown(body)
  };
}

function readChapters() {
  return readdirSync(CHAPTERS)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const match = FILE_NAME.exec(file);
      if (!match)
        throw new LoreMarkdownError(
          `"${file}" should be named like 01-the-planet.md`
        );
      return { file, order: Number(match[1]), slug: match[2] };
    })
    .sort((a, b) => a.order - b.order)
    .map(({ file, slug }) => {
      try {
        return chapterFrom(
          slug,
          readFileSync(path.join(CHAPTERS, file), 'utf8')
        );
      } catch (error) {
        // Says which file, so a slip is easy to find.
        throw new LoreMarkdownError(`${file}: ${(error as Error).message}`, {
          cause: error
        });
      }
    });
}

/** The lore: its copy and its chapters, checked and numbered. */
export const loadLore = cache((): LoreContent =>
  withNumerals(loreSchema.parse({ ...copy, chapters: readChapters() }))
);
