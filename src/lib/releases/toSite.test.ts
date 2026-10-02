import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PLACEHOLDER_COVER,
  PLACEHOLDER_TAPE,
  toSiteReleases,
  UNNAMED_TRACK,
  type SentRelease
} from './toSite';

const sent = (patch: Partial<SentRelease>): SentRelease => ({
  slug: 'menace',
  title: 'Menace',
  kind: 'single',
  status: 'released',
  artist: 'Candy Heist',
  date: '2025-03-14',
  credits: [],
  tracks: [{ title: 'Menace', isrc: 'QZES82500001' }],
  distribution: [],
  upc: '',
  ...patch
});

describe('releases as the pages show them', () => {
  afterEach(() => vi.restoreAllMocks());

  it('gives every release the placeholder cover and tape, which exist', () => {
    const [release] = toSiteReleases([sent({})]);
    expect(release.cover.src).toBe(PLACEHOLDER_COVER);
    expect(release.cover.alt).toBe('Menace: cover art to come');
    expect(release.tape).toBe(PLACEHOLDER_TAPE);
    for (const src of [PLACEHOLDER_COVER, PLACEHOLDER_TAPE])
      expect(existsSync(join(process.cwd(), 'public', src))).toBe(true);
  });

  it('leaves a release with no date undated', () => {
    const [release] = toSiteReleases([sent({ date: null })]);
    expect(release.date).toBeUndefined();
  });

  it('gives an album’s named tracks pages, and its single’s recording the single', () => {
    const album = sent({
      slug: '4x4',
      title: '4x4',
      kind: 'ep',
      tracks: [
        { title: 'Menace', isrc: 'QZES82500001' },
        { title: 'Overdrive', isrc: 'QZES82500002' },
        { title: 'Overdrive' },
        { title: '' }
      ]
    });
    const [, ep] = toSiteReleases([sent({}), album]);
    expect(ep.tracks).toEqual([
      { title: 'Menace', single: 'menace' },
      { title: 'Overdrive', slug: 'overdrive' },
      { title: 'Overdrive', slug: 'overdrive-2' },
      { title: UNNAMED_TRACK }
    ]);
  });

  it('gives a one-track release no track page', () => {
    const [single] = toSiteReleases([sent({})]);
    expect(single.tracks).toEqual([{ title: 'Menace' }]);
  });

  it('leaves out a release the pages can’t show, rather than failing', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const broken = sent({ slug: 'Not A Slug' });
    expect(toSiteReleases([broken, sent({})]).map((r) => r.slug)).toEqual([
      'menace'
    ]);
    expect(console.error).toHaveBeenCalled();
  });
});
