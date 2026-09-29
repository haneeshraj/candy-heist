import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findRelease, releaseHref, releases } from './releases';

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
    expect(findRelease('4x4')?.title).toBe('4x4');
    expect(findRelease('nope')).toBeUndefined();
    expect(releaseHref('over-the-moon')).toBe('/discography/over-the-moon');
  });
});
