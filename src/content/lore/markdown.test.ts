import { describe, expect, it } from 'vitest';
import {
  LoreMarkdownError,
  parseLoreMarkdown,
  splitFrontmatter
} from './markdown';

describe('parseLoreMarkdown', () => {
  it('reads paragraphs, folding their line breaks', () => {
    expect(parseLoreMarkdown('One line\nand the next.\n\nA second.')).toEqual([
      { kind: 'paragraph', runs: [{ text: 'One line and the next.' }] },
      { kind: 'paragraph', runs: [{ text: 'A second.' }] }
    ]);
  });

  it('keeps emphasis and strong as voices, spaces included', () => {
    expect(parseLoreMarkdown('The world *hums*, **always** & still.')).toEqual([
      {
        kind: 'paragraph',
        runs: [
          { text: 'The world ' },
          { text: 'hums', voice: 'emphasis' },
          { text: ', ' },
          { text: 'always', voice: 'strong' },
          { text: ' & still.' }
        ]
      }
    ]);
  });

  it('sets each paragraph of a quote as its own quote', () => {
    expect(parseLoreMarkdown('> Many becoming one.\n>\n> Again.')).toEqual([
      { kind: 'quote', runs: [{ text: 'Many becoming one.' }] },
      { kind: 'quote', runs: [{ text: 'Again.' }] }
    ]);
  });

  it('reads headings as plain text', () => {
    expect(parseLoreMarkdown('## The *first* age')).toEqual([
      { kind: 'heading', text: 'The first age' }
    ]);
  });

  it('reads a list of items', () => {
    expect(parseLoreMarkdown('- Water\n- **Stone** and salt')).toEqual([
      {
        kind: 'list',
        items: [
          [{ text: 'Water' }],
          [{ text: 'Stone', voice: 'strong' }, { text: ' and salt' }]
        ]
      }
    ]);
  });

  it('reads a list where every item names a term as entries', () => {
    const markdown = [
      '- **Vayr** — Keepers of structure.',
      '- **Elarin**: They see time in cycles.',
      '- **Nyxori:** Lithic, *crystalline*.'
    ].join('\n');
    expect(parseLoreMarkdown(markdown)).toEqual([
      {
        kind: 'entries',
        items: [
          { term: 'Vayr', runs: [{ text: 'Keepers of structure.' }] },
          { term: 'Elarin', runs: [{ text: 'They see time in cycles.' }] },
          {
            term: 'Nyxori',
            runs: [
              { text: 'Lithic, ' },
              { text: 'crystalline', voice: 'emphasis' },
              { text: '.' }
            ]
          }
        ]
      }
    ]);
  });

  it('reads loose lists, items a blank line apart, the same way', () => {
    expect(parseLoreMarkdown('- One\n\n- Two')).toEqual([
      { kind: 'list', items: [[{ text: 'One' }], [{ text: 'Two' }]] }
    ]);
  });

  it('skips comments and keeps escaped characters', () => {
    expect(
      parseLoreMarkdown('<!-- a note -->\n\nA \\*literal\\* star.')
    ).toEqual([{ kind: 'paragraph', runs: [{ text: 'A *literal* star.' }] }]);
  });

  it('drops inline HTML but keeps the words around it', () => {
    expect(parseLoreMarkdown('A <b>bold</b> claim.')).toEqual([
      { kind: 'paragraph', runs: [{ text: 'A bold claim.' }] }
    ]);
  });

  it('refuses what the page has no block for', () => {
    expect(() => parseLoreMarkdown('```\ncode\n```')).toThrow(
      LoreMarkdownError
    );
    expect(() => parseLoreMarkdown('| a |\n| - |\n| b |')).toThrow(
      LoreMarkdownError
    );
    expect(() => parseLoreMarkdown('<div>raw</div>')).toThrow(
      LoreMarkdownError
    );
  });
});

describe('splitFrontmatter', () => {
  it('splits the frontmatter from the text', () => {
    const { data, body } = splitFrontmatter(
      '---\ntitle: Omun\nstate: omun\n---\n\nThe text.\n'
    );
    expect(data).toEqual({ title: 'Omun', state: 'omun' });
    expect(body.trim()).toBe('The text.');
  });

  it('refuses a file without it', () => {
    expect(() => splitFrontmatter('The text.')).toThrow(LoreMarkdownError);
  });
});
