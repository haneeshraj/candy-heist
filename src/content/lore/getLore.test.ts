// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { presetFor } from '@/lib/planets/engine';
import { readPublishedLore } from '@/lib/lore/published';
import { getLore } from './getLore';
import { loadLore } from './loadLore';

// Which lore the pages show: the files until Candy Haven publishes, then
// Haven's alone.

vi.mock('@/lib/lore/published', () => ({ readPublishedLore: vi.fn() }));

const omun = presetFor('omun').spec;

afterEach(() => vi.clearAllMocks());

describe('getLore', () => {
  it('shows the files until Haven has published', async () => {
    vi.mocked(readPublishedLore).mockResolvedValue(null);
    const lore = await getLore();
    expect(lore.chapters.map((c) => c.slug)).toEqual(
      loadLore().chapters.map((c) => c.slug)
    );
  });

  it('shows only what Haven published, numbered in its order', async () => {
    vi.mocked(readPublishedLore).mockResolvedValue({
      chapters: [
        {
          slug: 'omun',
          title: 'Omun',
          line: 'A resonance.',
          body: 'It *rises*.',
          planet: omun
        },
        {
          slug: 'heist',
          title: 'Heist',
          line: 'The lock.',
          body: '> Broken.',
          planet: omun
        }
      ]
    });
    const lore = await getLore();
    expect(lore.chapters.map((c) => [c.numeral, c.slug])).toEqual([
      ['I', 'omun'],
      ['II', 'heist']
    ]);
    expect(lore.chapters[0].blocks).toEqual([
      {
        kind: 'paragraph',
        runs: [
          { text: 'It ' },
          { text: 'rises', voice: 'emphasis' },
          { text: '.' }
        ]
      }
    ]);
    expect(lore.chapters[0].planet).toEqual(omun);
    expect(lore.intro.label).toBe('The lore of Nayara');
  });

  it('can have no chapters at all', async () => {
    vi.mocked(readPublishedLore).mockResolvedValue({ chapters: [] });
    expect((await getLore()).chapters).toEqual([]);
  });

  it('leaves out a chapter it can’t read, rather than the lore', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(readPublishedLore).mockResolvedValue({
      chapters: [
        {
          slug: 'good',
          title: 'Good',
          line: 'Fine.',
          body: 'Text.',
          planet: omun
        },
        {
          slug: 'bad',
          title: 'Bad',
          line: 'Broken.',
          body: '| a | b |\n|---|---|\n| 1 | 2 |',
          planet: omun
        }
      ]
    });
    expect((await getLore()).chapters.map((c) => c.slug)).toEqual(['good']);
  });
});
