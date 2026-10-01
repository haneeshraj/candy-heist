import type { ReactNode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { discographyCopy } from '@/content/discography/discography';
import { releases } from '@/content/discography/releases';
import { gridReleases } from '@/lib/discography/catalogue';
import { summarize } from '@/lib/discography/summary';
import DiscographyPage from './DiscographyPage';

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

const copy = discographyCopy.page;
const now = new Date(2026, 8, 30).getTime();
const list = gridReleases(releases).map((r) => summarize(r, now));
const all = { hidden: true } as const;
const renderPage = () =>
  render(<DiscographyPage copy={copy} releases={list} />);
const grid = () => document.querySelector('ul[class*="grid"]') as HTMLElement;

beforeEach(() => window.history.replaceState(null, '', '/discography'));
afterEach(() => window.history.replaceState(null, '', '/'));

describe('DiscographyPage', () => {
  it('opens on its headline and the Vault: every release in the grid', () => {
    renderPage();
    expect(
      screen.getByRole('heading', {
        ...all,
        level: 1,
        name: `${copy.lead} ${copy.statement}`
      })
    ).toBeInTheDocument();
    expect(within(grid()).getAllByRole('link', all)).toHaveLength(list.length);
    expect(
      screen.getByRole('radio', { ...all, name: copy.views.vault })
    ).toBeChecked();
  });

  it('switches to the Index, and keeps the view in the address', () => {
    renderPage();
    fireEvent.click(
      screen.getByRole('radio', { ...all, name: copy.views.index })
    );
    expect(window.location.search).toBe('?view=index');
    expect(document.querySelector('ol[class*="list"]')).not.toBeNull();
  });

  it('filters by kind as it is chosen, then shows the filter as a tag', () => {
    renderPage();
    const button = screen.getByRole('button', {
      ...all,
      name: copy.filters.button
    });
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(screen.getByRole('checkbox', { ...all, name: /^EPs/ }));
    const eps = list.filter((r) => r.kind === 'ep');
    expect(within(grid()).getAllByRole('link', all)).toHaveLength(eps.length);
    expect(window.location.search).toBe('?kind=ep');

    fireEvent.click(button);
    const tag = screen.getByRole('button', { ...all, name: 'Remove EPs' });
    fireEvent.click(tag);
    expect(within(grid()).getAllByRole('link', all)).toHaveLength(list.length);
    expect(window.location.search).toBe('');
  });

  it('searches only when asked, then keeps the search in the address', () => {
    renderPage();
    fireEvent.click(
      screen.getByRole('button', { ...all, name: copy.search.open })
    );
    const box = screen.getByRole('searchbox', {
      ...all,
      name: copy.search.label
    });
    const target = list[list.length - 1];
    fireEvent.change(box, { target: { value: target.title } });
    // Typing alone changes nothing.
    expect(within(grid()).getAllByRole('link', all)).toHaveLength(list.length);

    fireEvent.click(
      screen.getByRole('button', { ...all, name: copy.search.submit })
    );
    const links = within(grid()).getAllByRole('link', all);
    expect(links.length).toBeLessThan(list.length);
    expect(links.map((link) => link.getAttribute('href'))).toContain(
      `/discography/${target.slug}`
    );
    expect(new URLSearchParams(window.location.search).get('q')).toBe(
      target.title
    );
  });

  it('reads a shared view and its filters from the address', () => {
    window.history.replaceState(
      null,
      '',
      '/discography?kind=single&sort=title'
    );
    renderPage();
    const titles = within(grid())
      .getAllByRole('link', all)
      .map((link) => link.querySelector('span[class*="title"]')?.textContent);
    const singles = list
      .filter((r) => r.kind === 'single')
      .map((r) => r.title)
      .sort((a, b) => a.localeCompare(b));
    expect(titles).toEqual(singles);
  });

  it('marks what is not out yet as forthcoming', () => {
    renderPage();
    const soon = list.filter((r) => r.forthcoming);
    expect(soon.length).toBeGreaterThan(0);
    expect(screen.getAllByText(new RegExp(copy.forthcoming, 'i')).length).toBe(
      soon.length
    );
  });
});
