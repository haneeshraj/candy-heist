import type { ReactNode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { discographyCopy } from '@/content/discography/discography';
import { findRelease, releases } from '@/content/discography/releases';
import { moreLike } from '@/lib/discography/catalogue';
import { summarize } from '@/lib/discography/summary';
import { appearsOn, findAlbumTrack } from '@/lib/discography/tracks';
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

// As the routes do: a release's page, and a track's under it.
function renderRelease(slug: string) {
  const release = findRelease(slug)!;
  render(
    <ReleasePage
      copy={copy}
      forthcoming={discographyCopy.page.forthcoming}
      release={release}
      alsoOn={appearsOn(release, releases)}
      more={moreLike(release, releases).map((r) => summarize(r, now))}
      renderedAt={now}
    />
  );
  return release;
}

function renderTrack(slug: string, track: string) {
  const found = findAlbumTrack(releases, slug, track)!;
  render(
    <ReleasePage
      copy={copy}
      forthcoming={discographyCopy.page.forthcoming}
      release={found.release}
      position={found.position}
      more={moreLike(found.release, releases).map((r) => summarize(r, now))}
      renderedAt={now}
    />
  );
  return found;
}

const runningOrder = () =>
  screen
    .getByRole('heading', { ...all, name: copy.runningOrder })
    .closest('section') as HTMLElement;

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

  it('links each named track to its page, and a single first to the single', () => {
    renderRelease('gold-seam');
    const running = runningOrder();
    expect(
      within(running).getByRole('link', { ...all, name: 'Filigree' })
    ).toHaveAttribute('href', '/discography/gold-seam/filigree');
    expect(
      within(running).getByRole('link', { ...all, name: 'Portal' })
    ).toHaveAttribute('href', '/discography/portal');
  });

  it('says which albums a single is also on', () => {
    renderRelease('portal');
    expect(screen.getByText(copy.alsoOn)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { ...all, name: 'Gold Seam' })
    ).toHaveAttribute('href', '/discography/gold-seam');
  });

  it('gives a track its own page, in its album’s cover, from its album', () => {
    const { release } = renderTrack('the-halls', 'vesper');
    expect(
      screen.getByRole('heading', { ...all, level: 1, name: 'Vesper' })
    ).toBeInTheDocument();
    // "From" the album where the kind would be, and back to it.
    expect(screen.getByText(copy.from, { exact: false })).toHaveTextContent(
      `${copy.from} ${release.title} · 16 September 2022`
    );
    expect(
      screen.getByRole('link', { ...all, name: `← ${release.title}` })
    ).toHaveAttribute('href', '/discography/the-halls');
    // The album's running order, with this track marked and the rest linked.
    const running = runningOrder();
    expect(within(running).getByText('Vesper')).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(
      within(running).queryByRole('link', { ...all, name: 'Vesper' })
    ).toBeNull();
    expect(
      within(running).getByRole('link', { ...all, name: 'Nave' })
    ).toHaveAttribute('href', '/discography/the-halls/nave');
    // The artwork it opens is the album's.
    fireEvent.click(
      screen.getByRole('button', { ...all, name: copy.viewArtwork })
    );
    const dialog = document.querySelector('dialog') as HTMLDialogElement;
    expect(
      within(dialog).getByRole('img', { ...all, name: release.cover.alt })
    ).toBeInTheDocument();
  });

  it('bills a track with who’s featured on it', () => {
    renderTrack('monolith', 'remembrance');
    expect(
      screen.getByText('Candy Heist feat. Guest Artist')
    ).toBeInTheDocument();
  });

  it('sends a forthcoming track to its own share page to pre-save', () => {
    renderTrack('gold-seam', 'filigree');
    expect(screen.getByText(/Out 13 November 2026/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { ...all, name: new RegExp(copy.presave, 'i') })
    ).toHaveAttribute('href', '/listen/gold-seam/filigree');
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

  it('shows the cover alone, on the page and in the viewer, with no video', () => {
    renderRelease('over-the-moon');
    const dialog = document.querySelector('dialog') as HTMLDialogElement;
    fireEvent.click(
      screen.getByRole('button', { ...all, name: copy.viewArtwork })
    );
    expect(document.querySelector('video')).toBeNull();
    // Only the cover's own button and the viewer's close: no Cover | Canvas.
    expect(
      screen.queryByRole('button', { ...all, name: /canvas/i })
    ).toBeNull();
    expect(within(dialog).getAllByRole('button', all)).toHaveLength(1);
  });
});
