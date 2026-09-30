import { describe, expect, it } from 'vitest';
import { chapterFrom, loadLore } from './loadLore';
import {
  chapterHref,
  copyOf,
  findChapter,
  loreSchema,
  summarize,
  withNumerals
} from './lore';

const lore = loadLore();

describe('lore content', () => {
  it('reads every chapter file, in order', () => {
    expect(lore.chapters.map((c) => c.slug).slice(0, 3)).toEqual([
      'the-planet',
      'omun',
      'nayarasam'
    ]);
    expect(lore.chapters.at(-1)?.slug).toBe('heist');
  });

  it('numbers the chapters by their order', () => {
    expect(lore.chapters.map((c) => c.numeral).slice(0, 4)).toEqual([
      'I',
      'II',
      'III',
      'IV'
    ]);
  });

  it('reads their markdown into blocks', () => {
    const life = findChapter(lore.chapters, 'sentient-life');
    expect(life?.blocks.map((b) => b.kind)).toContain('entries');
    expect(life?.blocks.map((b) => b.kind)).toContain('quote');
  });

  it('gives a new chapter the next numeral', () => {
    const next = chapterFrom(
      'chapter-to-come',
      '---\ntitle: To come\nline: Still being written.\nstate: network\n---\n\nSoon.'
    );
    const content = withNumerals(
      loreSchema.parse({ ...lore, chapters: [...lore.chapters, next] })
    );
    expect(content.chapters.at(-1)?.numeral).toBe('XII');
  });

  it('rejects two chapters with the same slug', () => {
    const broken = { ...lore, chapters: [...lore.chapters, lore.chapters[0]] };
    expect(loreSchema.safeParse(broken).success).toBe(false);
  });

  it('rejects a chapter without its frontmatter fields', () => {
    const bare = chapterFrom('bare', '---\ntitle: Bare\n---\n\nText.');
    expect(loreSchema.safeParse({ ...lore, chapters: [bare] }).success).toBe(
      false
    );
  });

  it('summarizes a chapter without its text, and the copy without them', () => {
    const summary = summarize(lore.chapters[1]);
    expect(summary).toMatchObject({ slug: 'omun', numeral: 'II', index: 1 });
    expect(summary).not.toHaveProperty('blocks');
    expect(copyOf(lore)).not.toHaveProperty('chapters');
  });

  it('links to a chapter by its slug', () => {
    expect(chapterHref('omun')).toBe('/lore/omun');
  });
});
