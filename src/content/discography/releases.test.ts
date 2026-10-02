import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  findRelease,
  releaseHref,
  fileReleases as releases,
  releaseSchema,
  trackHref
} from './releases';

const publicFile = (src: string) => join(process.cwd(), 'public', src);

describe('releases', () => {
  it('has enough tapes for the shelf to run without repeats in view', () => {
    expect(releases.length).toBeGreaterThanOrEqual(12);
  });

  it('gives every release a unique, URL-safe slug', () => {
    const slugs = releases.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it('points at artwork that exists', () => {
    for (const release of releases) {
      expect(existsSync(publicFile(release.cover.src)), release.cover.src).toBe(
        true
      );
      expect(existsSync(publicFile(release.tape)), release.tape).toBe(true);
    }
  });

  it('finds a release by slug and links to its page', () => {
    expect(findRelease(releases, '4x4')?.title).toBe('4x4');
    expect(findRelease(releases, 'nope')).toBeUndefined();
    expect(releaseHref('over-the-moon')).toBe('/discography/over-the-moon');
    expect(trackHref('the-halls', 'nave')).toBe('/discography/the-halls/nave');
  });

  it('gives a track a page of its own or its single’s, never both, once per release', () => {
    const halls = findRelease(releases, 'the-halls')!;
    const withTracks = (tracks: typeof halls.tracks) => ({ ...halls, tracks });
    expect(releaseSchema.safeParse(halls).success).toBe(true);
    expect(
      releaseSchema.safeParse(
        withTracks(
          halls.tracks.map((t, i) => (i ? t : { ...t, single: 'alabaster' }))
        )
      ).success
    ).toBe(false);
    expect(
      releaseSchema.safeParse(
        withTracks(
          halls.tracks.map((t, i) =>
            i === 1 ? { ...t, slug: halls.tracks[0].slug } : t
          )
        )
      ).success
    ).toBe(false);
  });

  it('keeps a single to its own page: its one track has none', () => {
    const single = findRelease(releases, 'alabaster')!;
    expect(
      releaseSchema.safeParse({
        ...single,
        tracks: [{ ...single.tracks[0], slug: 'alabaster' }]
      }).success
    ).toBe(false);
  });
});
