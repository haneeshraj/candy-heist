import type { Release } from '@/content/discography/releases';
import { isOut, yearOf } from './catalogue';
import { KIND_LABEL, trackCount } from './format';

// A release as the lists show it (the grid, the rail, the index, "more
// releases"): only what they need, so a page sends its reader that and not
// every track and credit.
export interface ReleaseSummary {
  slug: string;
  title: string;
  subtitle?: string;
  kind: Release['kind'];
  artist: string;
  date?: string;
  cover: Release['cover'];
  trackCount: number;
  /** Not out yet, as of when the page was made. */
  forthcoming: boolean;
}

export function summarize(release: Release, now: number): ReleaseSummary {
  return {
    slug: release.slug,
    title: release.title,
    subtitle: release.subtitle,
    kind: release.kind,
    artist: release.artist,
    date: release.date,
    cover: release.cover,
    trackCount: release.tracks.length,
    forthcoming: !isOut(release, now)
  };
}

/** The artist line: "Candy Heist", or "Candy Heist · Candy Heist Remix". */
export const artistLine = (r: Pick<ReleaseSummary, 'artist' | 'subtitle'>) =>
  r.subtitle ? `${r.artist} · ${r.subtitle}` : r.artist;

/**
 * The small line under a release, in parts: "EP", "2024", "4 tracks", or
 * while it isn't out, "EP", "Forthcoming". An undated release leaves out
 * the year.
 */
export function metaParts(r: ReleaseSummary, forthcoming: string) {
  const kind = KIND_LABEL[r.kind].one;
  if (r.forthcoming) return { kind, when: forthcoming, tracks: null };
  const year = yearOf(r);
  return {
    kind,
    when: year === null ? null : String(year),
    tracks: trackCount(r.trackCount)
  };
}

/** The same, as one line: "EP · 2024 · 4 tracks". */
export function metaLine(r: ReleaseSummary, forthcoming: string) {
  const { kind, when, tracks } = metaParts(r, forthcoming);
  return [kind, when, tracks].filter(Boolean).join(' · ');
}
