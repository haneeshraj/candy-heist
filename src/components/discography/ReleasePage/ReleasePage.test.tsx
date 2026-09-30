import type { ReactNode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { discographyCopy } from '@/content/discography/discography';
import { findRelease, releases } from '@/content/discography/releases';
import { moreLike } from '@/lib/discography/catalogue';
import { summarize } from '@/lib/discography/summary';
import ReleasePage from './ReleasePage';

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

vi.mock('@/lib/animation/gsap', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/animation/gsap')>();
  return { ...actual, gsap: { ...actual.gsap, set: () => undefined } };
});

const copy = discographyCopy.release;
const now = new Date(2026, 8, 30, 12).getTime();
const all = { hidden: true } as const;

function renderRelease(slug: string) {
  const release = findRelease(slug)!;
  render(
    <ReleasePage
      copy={copy}
      forthcoming={discographyCopy.page.forthcoming}
      release={release}
      more={moreLike(release, releases).map((r) => summarize(r, now))}
      renderedAt={now}
    />
  );
  return release;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
});
afterEach(() => vi.useRealTimers());

describe('ReleasePage', () => {
  it('gives a released single its platforms, copy link and credits', () => {
    const release = renderRelease('alabaster');
    expect(
      screen.getByRole('heading', { ...all, level: 1, name: release.title })
    ).toBeInTheDocument();
    const platforms = screen.getByRole('list', {
      ...all,
      name: copy.platforms
    });
    expect(within(platforms).getAllByRole('link', all)).toHaveLength(
      release.distribution.length
    );
    expect(
      within(platforms).getByRole('link', { ...all, name: /Listen on Spotify/ })
    ).toHaveAttribute('target', '_blank');
    expect(
      screen.getByRole('button', { ...all, name: copy.copyLink })
    ).toBeInTheDocument();
    expect(screen.getByText('Produced by')).toBeInTheDocument();
    expect(screen.getByText(copy.released)).toBeInTheDocument();
    // One track: no running order, and more singles to go on to.
    expect(
      screen.queryByRole('heading', { ...all, name: copy.runningOrder })
    ).toBeNull();
    expect(
      screen.getByRole('heading', { ...all, name: copy.moreSingles })
    ).toBeInTheDocument();
  });

  it('counts down to a forthcoming release, with a pre-save to its share page', () => {
    renderRelease('portal');
    expect(screen.getByText(/Out 23 October 2026/i)).toBeInTheDocument();
    expect(
      screen.getByText(`${copy.countdown.label} 22 days`)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { ...all, name: new RegExp(copy.presave, 'i') })
    ).toHaveAttribute('href', '/listen/portal');
    expect(
      screen.queryByRole('list', { ...all, name: copy.platforms })
    ).toBeNull();
    expect(screen.getByText(copy.releaseDate)).toBeInTheDocument();
  });

  it('lays out an album’s running order, and more albums & EPs', () => {
    const release = renderRelease('monolith');
    const running = screen
      .getByRole('heading', { ...all, name: copy.runningOrder })
      .closest('section') as HTMLElement;
    expect(within(running).getAllByRole('listitem', all)).toHaveLength(
      release.tracks.length
    );
    expect(within(running).getByText('feat. Guest Artist')).toBeInTheDocument();
    expect(screen.getByText('8 tracks · 37:44')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { ...all, name: copy.moreCollections })
    ).toBeInTheDocument();
  });

  it('keeps a real release to what is known: no date, no credits', () => {
    renderRelease('over-the-moon');
    expect(screen.queryByText(copy.released)).toBeNull();
    expect(screen.queryByText('Produced by')).toBeNull();
  });

  it('opens the artwork large from the cover, and shuts it again', () => {
    const release = renderRelease('alabaster');
    const dialog = document.querySelector('dialog') as HTMLDialogElement;
    expect(dialog).not.toHaveAttribute('open');

    fireEvent.click(
      screen.getByRole('button', { ...all, name: copy.viewArtwork })
    );
    expect(dialog).toHaveAttribute('open');
    expect(
      within(dialog).getByRole('img', { ...all, name: release.cover.alt })
    ).toBeInTheDocument();

    fireEvent.click(
      within(dialog).getByRole('button', { ...all, name: copy.close })
    );
    expect(dialog).not.toHaveAttribute('open');
    expect(within(dialog).queryByRole('img', all)).toBeNull();
  });

  it('shuts the viewer on Escape', () => {
    renderRelease('alabaster');
    const dialog = document.querySelector('dialog') as HTMLDialogElement;
    fireEvent.click(
      screen.getByRole('button', { ...all, name: copy.viewArtwork })
    );
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(dialog).not.toHaveAttribute('open');
  });

  it('switches the page to the face the viewer switches to', () => {
    renderRelease('over-the-moon');
    const dialog = document.querySelector('dialog') as HTMLDialogElement;
    fireEvent.click(
      screen.getByRole('button', { ...all, name: copy.viewArtwork })
    );
    fireEvent.click(
      within(dialog).getByRole('button', { ...all, name: copy.canvas })
    );
    expect(dialog.querySelector('video')).not.toBeNull();
    // The page's own switch follows, so the flight back lands on the canvas.
    const pageCanvas = screen
      .getAllByRole('button', { ...all, name: copy.canvas })
      .find((b) => !dialog.contains(b));
    expect(pageCanvas).toHaveAttribute('aria-pressed', 'true');
  });
});
