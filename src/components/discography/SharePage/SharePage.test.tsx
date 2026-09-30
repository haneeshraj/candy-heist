import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { discographyCopy } from '@/content/discography/discography';
import { findRelease, releases } from '@/content/discography/releases';
import { findAlbumTrack } from '@/lib/discography/tracks';
import SharePage from './SharePage';

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

const now = new Date(2026, 8, 30, 12).getTime();
const all = { hidden: true } as const;

function renderShare(slug: string) {
  const release = findRelease(slug)!;
  render(
    <SharePage copy={discographyCopy} release={release} renderedAt={now} />
  );
  return release;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
});
afterEach(() => vi.useRealTimers());

describe('SharePage', () => {
  it('lists every platform to play a released record on, and its copyright', () => {
    const release = renderShare('alabaster');
    expect(
      screen.getByRole('heading', { ...all, level: 1, name: release.title })
    ).toBeInTheDocument();
    const links = screen
      .getAllByRole('link', all)
      .filter((a) => a.getAttribute('target') === '_blank');
    expect(links).toHaveLength(release.distribution.length);
    expect(screen.queryByText(discographyCopy.share.presave)).toBeNull();
    expect(screen.getByText('© 2020 Candy Heist')).toBeInTheDocument();
  });

  it('before it is out: the countdown, and only where it can be pre-saved', () => {
    const release = renderShare('portal');
    expect(screen.getByText(/Out 23 October 2026/i)).toBeInTheDocument();
    const presaves = release.distribution.filter((d) => d.presaveUrl);
    const links = screen
      .getAllByRole('link', all)
      .filter((a) => a.getAttribute('target') === '_blank');
    expect(links).toHaveLength(presaves.length);
    expect(links[0]).toHaveAttribute('href', presaves[0].presaveUrl);
    expect(screen.getByText('Pre-add')).toBeInTheDocument();
    expect(screen.getAllByText(discographyCopy.share.presave).length).toBe(
      presaves.length - 1
    );
  });

  it('shares a track in its release’s cover, from its release', () => {
    const { release, position } = findAlbumTrack(
      releases,
      'the-halls',
      'nave'
    )!;
    render(
      <SharePage
        copy={discographyCopy}
        release={release}
        position={position}
        renderedAt={now}
      />
    );
    expect(
      screen.getByRole('heading', { ...all, level: 1, name: 'Nave' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(`From ${release.title} · 16 September 2022`)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { ...all, name: release.cover.alt })
    ).toBeInTheDocument();
  });

  it('gives an undated release a copyright without a year', () => {
    renderShare('over-the-moon');
    expect(
      screen.getByText(discographyCopy.share.copyrightUndated)
    ).toBeInTheDocument();
  });
});
