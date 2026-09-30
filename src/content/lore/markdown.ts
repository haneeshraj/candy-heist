import { marked, type Token, type Tokens } from 'marked';
import { parse as parseYaml } from 'yaml';
import type { LoreBlock, LoreRun } from './lore';

// A chapter is written in plain markdown, the way it would be typed into
// an editor (Candy Haven's, later): frontmatter for its title, its line
// and the planet's look, then the text. The text is read into the page's
// own blocks, never into HTML, so each one keeps its reveal and nothing
// written can reach the page as markup.
//
//   A paragraph.            → paragraph (*emphasis* in the accent voice,
//                             **strong** in the heavy one)
//   > A line set large.     → quote
//   ## A heading            → heading
//   - An item               → list
//   - **Term** — its text   → entries (every item a term, then — or :)
//
// Anything else (code, tables, images, raw HTML) is refused, loudly, so it
// shows up while writing instead of vanishing from the page.

type LoreVoice = NonNullable<LoreRun['voice']>;

export class LoreMarkdownError extends Error {
  name = 'LoreMarkdownError';
}

// Where a term ends and its text begins: "**Term** — text", "**Term**: text".
const TERM_SEPARATOR = /^\s*(?:[—–-]|:)\s*/;
const COMMENT = /^\s*<!--[\s\S]*-->\s*$/;

function inline(tokens: Token[], voice?: LoreVoice): LoreRun[] {
  return tokens.flatMap((token): LoreRun[] => {
    switch (token.type) {
      case 'text':
        return 'tokens' in token && token.tokens?.length
          ? inline(token.tokens, voice)
          : [{ text: token.text, voice }];
      case 'escape':
      case 'codespan':
        return [{ text: token.text, voice }];
      case 'em':
        return inline((token as Tokens.Em).tokens, 'emphasis');
      case 'strong':
        return inline((token as Tokens.Strong).tokens, 'strong');
      // A link keeps its words; the page has no links in running text.
      case 'link':
      case 'del':
        return inline((token as Tokens.Link | Tokens.Del).tokens, voice);
      case 'br':
        return [{ text: ' ', voice }];
      // Inline HTML is dropped: its text, if any, is the text around it.
      case 'html':
        return [];
      default:
        throw new LoreMarkdownError(
          `Lore text can't use inline "${token.type}": ${token.raw}`
        );
    }
  });
}

// Joins runs of the same voice, folds line breaks and runs of spaces into
// one space, and trims the ends.
function tidy(runs: LoreRun[]): LoreRun[] {
  const joined: LoreRun[] = [];
  for (const run of runs) {
    const text = run.text.replace(/\s+/g, ' ');
    const last = joined.at(-1);
    // A bare space between two voices belongs to the one before it.
    if (last && (last.voice === run.voice || text === ' ')) last.text += text;
    else joined.push(run.voice ? { text, voice: run.voice } : { text });
  }
  if (joined.length) {
    joined[0].text = joined[0].text.trimStart();
    joined[joined.length - 1].text = joined[joined.length - 1].text.trimEnd();
  }
  return joined.filter((run) => run.text.length > 0);
}

const plain = (runs: LoreRun[]) => runs.map((run) => run.text).join('');

function required(runs: LoreRun[], raw: string) {
  if (!runs.length)
    throw new LoreMarkdownError(`This has no text to show: ${raw.trim()}`);
  return runs;
}

// An item's runs: a tight list holds its text directly, a loose one (items
// a blank line apart) holds paragraphs.
function itemRuns(item: Tokens.ListItem) {
  const tokens = item.tokens.flatMap((token) =>
    token.type === 'paragraph'
      ? [...(token as Tokens.Paragraph).tokens]
      : [token]
  );
  return required(tidy(inline(tokens)), item.raw);
}

// "**Term** — text": the item opens in the strong voice, then a separator
// (or the colon sits inside the bold, "**Term:** text").
function asEntry(runs: LoreRun[]) {
  const [head, next, ...rest] = runs;
  if (head?.voice !== 'strong' || !next) return null;
  const term = head.text.replace(/:\s*$/, '').trim();
  const inside = head.text.trimEnd().endsWith(':');
  if (!inside && !TERM_SEPARATOR.test(next.text)) return null;
  const text = inside ? next.text : next.text.replace(TERM_SEPARATOR, '');
  const body = tidy([{ ...next, text }, ...rest]);
  return term && body.length ? { term, runs: body } : null;
}

function block(token: Token): LoreBlock[] {
  switch (token.type) {
    case 'space':
      return [];
    case 'paragraph':
      return [
        {
          kind: 'paragraph',
          runs: required(
            tidy(inline((token as Tokens.Paragraph).tokens)),
            token.raw
          )
        }
      ];
    case 'heading':
      return [
        {
          kind: 'heading',
          text: plain(
            required(tidy(inline((token as Tokens.Heading).tokens)), token.raw)
          )
        }
      ];
    // Each paragraph of a quote is set as its own line.
    case 'blockquote':
      return (token as Tokens.Blockquote).tokens.flatMap((child) => {
        if (child.type === 'space') return [];
        if (child.type !== 'paragraph')
          throw new LoreMarkdownError(
            `A quote can only hold text: ${child.raw.trim()}`
          );
        return [
          {
            kind: 'quote' as const,
            runs: required(
              tidy(inline((child as Tokens.Paragraph).tokens)),
              child.raw
            )
          }
        ];
      });
    case 'list': {
      const items = (token as Tokens.List).items.map(itemRuns);
      const entries = items.map(asEntry);
      return entries.every((entry) => entry !== null)
        ? [{ kind: 'entries', items: entries }]
        : [{ kind: 'list', items }];
    }
    // Comments are notes for whoever writes the chapter.
    case 'html':
      if (COMMENT.test(token.raw)) return [];
      throw new LoreMarkdownError(
        `Lore text can't use HTML: ${token.raw.trim()}`
      );
    default:
      throw new LoreMarkdownError(
        `Lore text can't use "${token.type}": ${token.raw.trim()}`
      );
  }
}

/** Reads a chapter's markdown text into its blocks. */
export function parseLoreMarkdown(markdown: string): LoreBlock[] {
  return marked.lexer(markdown).flatMap(block);
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
