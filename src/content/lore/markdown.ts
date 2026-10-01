import { parse as parseYaml } from 'yaml';
import {
  MarkdownBlocksError,
  parseMarkdownBlocks
} from '@/lib/markdown/blocks';
import type { LoreBlock } from './lore';

// A chapter is written in plain markdown, the way it would be typed into
// an editor (Candy Haven's, later): frontmatter for its title, its line
// and the planet's look, then the text, read into blocks by the shared
// reader in lib/markdown/blocks (paragraphs, quotes, headings, lists and
// entries; anything else is refused).

export class LoreMarkdownError extends Error {
  name = 'LoreMarkdownError';
}

/** Reads a chapter's markdown text into its blocks. */
export function parseLoreMarkdown(markdown: string): LoreBlock[] {
  try {
    return parseMarkdownBlocks(markdown, 'Lore text');
  } catch (error) {
    if (error instanceof MarkdownBlocksError)
      throw new LoreMarkdownError(error.message);
    throw error;
  }
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[^\S\r\n]*(?:\r?\n|$)/;

/** Splits a markdown file into its frontmatter (as data) and its text. */
export function splitFrontmatter(source: string): {
  data: unknown;
  body: string;
} {
  const match = FRONTMATTER.exec(source.replace(/^﻿/, ''));
  if (!match)
    throw new LoreMarkdownError(
      'A chapter starts with its frontmatter, between two "---" lines'
    );
  return {
    data: parseYaml(match[1]) ?? {},
    body: source.replace(/^﻿/, '').slice(match[0].length)
  };
}
