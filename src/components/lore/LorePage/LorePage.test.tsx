import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadLore } from '@/content/lore/loadLore';
import { copyOf, summarize } from '@/content/lore/lore';
import LorePage from './LorePage';

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

// The reveals prime every letter with gsap.set, which jsdom makes slow;
// they aren't under test here.
vi.mock('@/lib/animation/gsap', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/animation/gsap')>();
  return { ...actual, gsap: { ...actual.gsap, set: () => undefined } };
});

const lore = loadLore();
const copy = copyOf(lore);
const chapters = lore.chapters.map(summarize);
const all = { hidden: true } as const;
const renderPage = () => render(<LorePage copy={copy} chapters={chapters} />);

afterEach(() => vi.useRealTimers());

describe('LorePage', () => {
  it('opens on the arrival heading', () => {
    renderPage();
    expect(
      screen.getByRole('heading', {
        ...all,
        level: 1,
        name: `${copy.intro.lead} ${copy.intro.statement.replace('\n', ' ')}`
      })
    ).toBeInTheDocument();
  });

  it('links every chapter to its own page, from the orbit and the list', () => {
    renderPage();
    for (const chapter of chapters) {
      const links = screen
        .getAllByRole('link', all)
        .filter(
          (link) => link.getAttribute('href') === `/lore/${chapter.slug}`
        );
      // Its orbit node and its place in the stacked list.
      expect(links.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('previews a node once the pointer rests on it, not as it passes', () => {
    vi.useFakeTimers();
    renderPage();
    const read = () =>
      screen.getByRole('link', {
        ...all,
        name: new RegExp(copy.index.read, 'i')
      });
    expect(read()).toHaveAttribute('href', `/lore/${chapters[0].slug}`);

    const node = (i: number) =>
      document.querySelectorAll('[data-motion="node"] a')[i] as HTMLElement;

    // Passing over IX on the way somewhere else leaves the preview be.
    fireEvent.mouseEnter(node(8));
    act(() => vi.advanceTimersByTime(80));
    fireEvent.mouseLeave(node(8));
    act(() => vi.advanceTimersByTime(400));
    expect(read()).toHaveAttribute('href', `/lore/${chapters[0].slug}`);

    // Resting on it previews it.
    fireEvent.mouseEnter(node(8));
    act(() => vi.advanceTimersByTime(400));
    expect(read()).toHaveAttribute('href', `/lore/${chapters[8].slug}`);
  });

  it('previews a node straight away when it takes focus', () => {
    renderPage();
    const node = document.querySelectorAll('[data-motion="node"] a')[3];
    fireEvent.focus(node);
    expect(
      screen.getByRole('link', {
        ...all,
        name: new RegExp(copy.index.read, 'i')
      })
    ).toHaveAttribute('href', `/lore/${chapters[3].slug}`);
  });

  it('leaves a node for the chapter still being written', () => {
    renderPage();
    expect(
      document.querySelectorAll('[data-motion="node"][data-state="next"]')
    ).toHaveLength(1);
  });
});
