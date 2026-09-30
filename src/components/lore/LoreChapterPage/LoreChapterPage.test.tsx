import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { loadLore } from '@/content/lore/loadLore';
import { copyOf, findChapter, summarize } from '@/content/lore/lore';
import LoreChapterPage from './LoreChapterPage';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  )
}));

// The reveals prime every word with gsap.set, which jsdom makes slow;
// they aren't under test here.
vi.mock('@/lib/animation/gsap', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/animation/gsap')>();
  return { ...actual, gsap: { ...actual.gsap, set: () => undefined } };
});

// Nayara in all her looks is thousands of SVG paths, and not under test.
vi.mock('@/components/common/NayaraPlanet', () => ({
  NayaraPlanet: () => <svg data-testid="planet" />
}));

const lore = loadLore();
const copy = copyOf(lore);
const chapters = lore.chapters.map(summarize);
const all = { hidden: true } as const;

function renderChapter(slug: string) {
  const chapter = findChapter(lore.chapters, slug)!;
  render(<LoreChapterPage copy={copy} chapters={chapters} chapter={chapter} />);
  return chapter;
}

describe('LoreChapterPage', () => {
  it('titles the page with the chapter', () => {
    const chapter = renderChapter('omun');
    expect(
      screen.getByRole('heading', { ...all, level: 1, name: chapter.title })
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${copy.index.chapter} II / XI`)
    ).toBeInTheDocument();
  });

  it('reads out its markdown: a quote, a list, entries', () => {
    renderChapter('sentient-life');
    expect(document.querySelector('blockquote')).not.toBeNull();
    const terms = [...document.querySelectorAll('dt')].map(
      (dt) => dt.textContent
    );
    expect(terms).toContain('Vayr');
  });

  it('leads on to the next chapter, and back to all of them', () => {
    renderChapter('omun');
    const next = screen.getByRole('navigation', {
      ...all,
      name: `${copy.reader.next}: Nayarasam`
    });
    expect(
      within(next).getByRole('link', {
        ...all,
        name: new RegExp(copy.reader.next, 'i')
      })
    ).toHaveAttribute('href', '/lore/nayarasam');
    expect(
      within(next).getByRole('link', {
        ...all,
        name: new RegExp(copy.reader.all, 'i')
      })
    ).toHaveAttribute('href', '/lore');
  });

  it('ends the last chapter with the end, not a next one', () => {
    renderChapter('heist');
    expect(
      screen.getByText(copy.end.label.replace('{total}', 'XI'))
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        ...all,
        name: new RegExp(copy.end.listen.label, 'i')
      })
    ).toHaveAttribute('href', copy.end.listen.href);
  });

  it('marks this chapter as the current page in the orbit and the menu', () => {
    const chapter = renderChapter('omun');
    const current = document.querySelectorAll('a[aria-current="page"]');
    expect(current.length).toBe(2);
    current.forEach((link) =>
      expect(link).toHaveAttribute('href', `/lore/${chapter.slug}`)
    );
  });
});
