import { describe, expect, it } from 'vitest';
import type { Release } from '@/content/discography/releases';
import {
  activeFilterCount,
  applyFilters,
  gridReleases,
  isOut,
  kindCounts,
  moreLike,
  NO_FILTERS,
  releaseYears,
  sortReleases
} from './catalogue';

const release = (over: Partial<Release> & Pick<Release, 'slug'>): Release => ({
  title: over.slug,
  kind: 'single',
  artist: 'Candy Heist',
  cover: { src: '/c.webp', alt: '' },
  tape: '/t.webp',
  credits: [],
  tracks: [{ title: over.slug }],
  distribution: [],
  ...over
});

const album = release({
  slug: 'album',
  kind: 'album',
  date: '2025-05-12',
  tracks: [
    { title: 'Lead', single: 'lead' },
    { title: 'Later', single: 'later' },
    { title: 'Deep cut' }
  ]
});
const lead = release({ slug: 'lead', date: '2025-03-01' });
const later = release({ slug: 'later', date: '2025-08-01' });

describe('gridReleases', () => {
  it('keeps a single that came out before its album', () => {
    expect(gridReleases([album, lead]).map((r) => r.slug)).toEqual([
      'album',
      'lead'
    ]);
  });

  it('leaves out a single of an album track released after the album', () => {
    expect(gridReleases([album, later]).map((r) => r.slug)).toEqual(['album']);
  });

  it('leaves out a single released the same day as its album', () => {
    const sameDay = release({ slug: 'lead', date: '2025-05-12' });
    expect(gridReleases([album, sameDay]).map((r) => r.slug)).toEqual([
      'album'
    ]);
  });

  it('keeps singles that belong to no album', () => {
    const alone = release({ slug: 'alone', date: '2020-01-01' });
    expect(gridReleases([album, alone]).map((r) => r.slug)).toContain('alone');
  });
});

describe('isOut', () => {
  const now = new Date(2026, 8, 30).getTime();
  it('is out on and after its date, and when the date is unknown', () => {
    expect(isOut({ date: '2026-09-30' }, now)).toBe(true);
    expect(isOut({ date: '2025-01-01' }, now)).toBe(true);
    expect(isOut({}, now)).toBe(true);
  });
  it('is not out before its date', () => {
    expect(isOut({ date: '2026-10-23' }, now)).toBe(false);
  });
});

describe('sorting and filtering', () => {
  const list = [
    release({ slug: 'b', title: 'Beta', kind: 'ep', date: '2023-01-01' }),
    release({ slug: 'a', title: 'Alpha', kind: 'single', date: '2024-01-01' }),
    release({ slug: 'c', title: 'Gamma', kind: 'album' }),
    release({ slug: 'd', title: 'Delta', kind: 'single', date: '2021-06-01' })
  ];

  it('sorts newest or oldest first, the undated last either way', () => {
    expect(sortReleases(list, 'newest').map((r) => r.slug)).toEqual([
      'a',
      'b',
      'd',
      'c'
    ]);
    expect(sortReleases(list, 'oldest').map((r) => r.slug)).toEqual([
      'd',
      'b',
      'a',
      'c'
    ]);
  });

  it('sorts by title', () => {
    expect(sortReleases(list, 'title').map((r) => r.title)).toEqual([
      'Alpha',
      'Beta',
      'Delta',
      'Gamma'
    ]);
  });

  it('filters by kind and year together', () => {
    const shown = applyFilters(
      list,
      { kinds: ['single'], years: [2024] },
      'newest'
    );
    expect(shown.map((r) => r.slug)).toEqual(['a']);
    expect(applyFilters(list, NO_FILTERS, 'newest')).toHaveLength(4);
  });

  it('searches the title, the kind, the year and the track titles', () => {
    const search = (query: string) =>
      applyFilters(
        [...list, { ...album, trackTitles: album.tracks.map((t) => t.title) }],
        NO_FILTERS,
        'newest',
        query
      ).map((r) => r.slug);
    expect(search('gam')).toEqual(['c']);
    expect(search('single 2021')).toEqual(['d']);
    // A song finds the album it's on.
    expect(search('deep cut')).toEqual(['album']);
    expect(search('nothing like it')).toEqual([]);
  });

  it('counts kinds, years and the filters that are on', () => {
    expect(kindCounts(list).get('single')).toBe(2);
    expect(releaseYears(list)).toEqual([2024, 2023, 2021]);
    expect(activeFilterCount({ kinds: ['ep', 'single'], years: [2024] })).toBe(
      3
    );
  });
});

describe('moreLike', () => {
  const singles = ['s1', 's2', 's3', 's4', 's5'].map((slug, i) =>
    release({ slug, date: `202${i}-01-01` })
  );
  const ep = release({
    slug: 'ep',
    kind: 'ep',
    date: '2024-01-01',
    tracks: [{ title: 'a' }, { title: 'b' }]
  });

  it('gathers the newest four of the same family, never itself', () => {
    expect(moreLike(singles[0], [...singles, ep]).map((r) => r.slug)).toEqual([
      's5',
      's4',
      's3',
      's2'
    ]);
    expect(moreLike(ep, [...singles, ep, album])).toEqual([album]);
  });
});
