import { describe, expect, it } from 'vitest';
import {
  findRelease,
  fileReleases as releases
} from '@/content/discography/releases';
import {
  albumTracks,
  appearsOn,
  billing,
  findAlbumTrack,
  pageRecord,
  rowHref
} from './tracks';

const release = (slug: string) => findRelease(releases, slug)!;

describe('albumTracks', () => {
  it('gives each named track of a release with several a page of its own', () => {
    const paths = albumTracks(releases).map(
      (t) => `${t.release.slug}/${t.track.slug}`
    );
    expect(paths).toContain('the-halls/nave');
    expect(paths).toContain('4x4/menace');
    // Portal came out as a single first: its row is the single's page.
    expect(paths).not.toContain('gold-seam/portal');
    // 4x4's tracks still to be named have none.
    expect(paths.filter((p) => p.startsWith('4x4/'))).toEqual(['4x4/menace']);
    // A single's page is its one track's page already.
    expect(paths.some((p) => p.startsWith('alabaster/'))).toBe(false);
  });

  it('finds a track by its release and its own slug, with its place', () => {
    const found = findAlbumTrack(releases, 'the-halls', 'vesper');
    expect(found?.track.title).toBe('Vesper');
    expect(found?.position).toBe(4);
    expect(findAlbumTrack(releases, 'monolith', 'vesper')).toBeUndefined();
    expect(findAlbumTrack(releases, 'nope', 'vesper')).toBeUndefined();
  });
});

describe('rowHref', () => {
  it('sends a row to its own page, a single’s to the single, an unnamed one nowhere', () => {
    const seam = release('gold-seam');
    expect(rowHref(seam, seam.tracks[0])).toBe(
      '/discography/gold-seam/gold-seam'
    );
    expect(
      rowHref(
        seam,
        seam.tracks.find((t) => t.single)!
      )
    ).toBe('/discography/portal');
    const ep = release('4x4');
    expect(rowHref(ep, ep.tracks[1])).toBeNull();
  });
});

describe('appearsOn', () => {
  it('finds the releases whose running orders carry a single', () => {
    expect(appearsOn(release('portal'), releases).map((r) => r.slug)).toEqual([
      'gold-seam'
    ]);
    expect(appearsOn(release('alabaster'), releases)).toEqual([]);
  });
});

describe('pageRecord', () => {
  it('is the release on its own page', () => {
    const moon = release('over-the-moon');
    const record = pageRecord(moon);
    expect(record.title).toBe(moon.title);
    expect(record.share).toBe('/listen/over-the-moon');
    expect(record.from).toBeUndefined();
  });

  it('is the track on a track’s page, from its release', () => {
    const monolith = release('monolith');
    const record = pageRecord(monolith, 4);
    expect(record.title).toBe('Remembrance');
    expect(record.share).toBe('/listen/monolith/remembrance');
    expect(record.from).toEqual({
      title: monolith.title,
      href: '/discography/monolith'
    });
    expect(billing(record, 'feat. {names}')).toBe(
      `${monolith.artist} feat. Guest Artist`
    );
  });

  it('keeps a compilation track’s own artist', () => {
    expect(pageRecord(release('resonance'), 2).artist).toBe('Guest Artist');
  });

  it('falls back to the release for a row without a page', () => {
    expect(pageRecord(release('4x4'), 2).title).toBe('4x4');
  });
});
