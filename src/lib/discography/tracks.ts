import {
  releaseHref,
  shareHref,
  trackHref,
  trackShareHref
} from '@/content/discography/links';
import type { Release, Track } from '@/content/discography/releases';
import { fill } from '@/lib/text/fill';
import { isOneTrack } from './catalogue';
import { artistLine } from './summary';

// A release's tracks as pages of their own. A track that came out with its
// album (or EP, or compilation) has a page under the album's, in the
// album's cover; the grid never lists it, only the album, whose running
// order leads to it. A track that came out as a single first is that
// single: its row goes to the single's page, in the single's own cover,
// and the single's page says which album it's also on. Both follow from
// the running orders alone, as Candy Haven's "track of" and "also on" do:
// the rows are the one copy of the relationship.

/** A track with a page of its own, on the release it came out on. */
export interface AlbumTrack {
  release: Release;
  track: Track & { slug: string };
  /** Its place in the running order, from 1. */
  position: number;
}

/** Every track with a page of its own, release by release. */
export function albumTracks(releases: readonly Release[]): AlbumTrack[] {
  return releases.flatMap((release) =>
    release.tracks.flatMap(({ slug, ...track }, i) =>
      slug ? [{ release, track: { ...track, slug }, position: i + 1 }] : []
    )
  );
}

export function findAlbumTrack(
  releases: readonly Release[],
  releaseSlug: string,
  trackSlug: string
): AlbumTrack | undefined {
  return albumTracks(releases).find(
    (t) => t.release.slug === releaseSlug && t.track.slug === trackSlug
  );
}

/**
 * Where a running order's row goes: the track's own page, or its single's.
 * Nowhere while it's still to be named.
 */
export function rowHref(release: Pick<Release, 'slug'>, track: Track) {
  if (track.single) return releaseHref(track.single);
  if (track.slug) return trackHref(release.slug, track.slug);
  return null;
}

/** The releases whose running orders carry this one: an album, its single. */
export function appearsOn(release: Release, releases: readonly Release[]) {
  return releases.filter(
    (r) =>
      r.slug !== release.slug &&
      r.tracks.some((track) => track.single === release.slug)
  );
}

/**
 * What a page is of: the release, or on a track's page the track. A track
 * shows its own title and artist in the release's cover, and borrows the
 * release's date, label, credits and platforms; the release's canvas loop
 * is its own, so a track goes without.
 */
export interface PageRecord {
  title: string;
  /** The billed artist line (a remix's subtitle after it). */
  artist: string;
  featuring?: string[];
  canvas?: Release['canvas'];
  /** Its share link page. */
  share: string;
  /** On a track's page: the release it came out on. */
  from?: { title: string; href: string };
}

export function pageRecord(release: Release, position?: number): PageRecord {
  const track = position ? release.tracks[position - 1] : undefined;
  if (track?.slug)
    return {
      title: track.title,
      artist: track.artist ?? release.artist,
      featuring: track.featuring,
      share: trackShareHref(release.slug, track.slug),
      from: { title: release.title, href: releaseHref(release.slug) }
    };
  return {
    title: release.title,
    artist: artistLine(release),
    featuring: isOneTrack(release) ? release.tracks[0].featuring : undefined,
    canvas: release.canvas,
    share: shareHref(release.slug)
  };
}

/** The artist line with who's featured: "Candy Heist feat. Guest Artist". */
export function billing(record: PageRecord, featuring: string) {
  if (!record.featuring?.length) return record.artist;
  const names = record.featuring.join(', ');
  return `${record.artist} ${fill(featuring, { names })}`;
}
