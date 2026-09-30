import type { Release, ReleaseKind } from '@/content/discography/releases';

// The discography page's rules: which releases get a place in the grid,
// whether one is out yet, and how the filters and sorts narrow the rest.
// Plain functions of the catalogue, so a database can stand in for the
// JSON without any of this changing.

/** Kinds that hold other releases' recordings. */
const COLLECTIONS: ReadonlySet<ReleaseKind> = new Set([
  'album',
  'ep',
  'compilation'
]);

/** Midnight local time on the release date, or null when it isn't known. */
export function releaseTime(release: Pick<Release, 'date'>): number | null {
  if (!release.date) return null;
  const [y, m, d] = release.date.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

/** Out already. A release without a date is one that's out, date unknown. */
export function isOut(release: Pick<Release, 'date'>, now: number) {
  const time = releaseTime(release);
  return time === null || time <= now;
}

/**
 * The releases that get their own place in the grid. An album's (or EP's,
 * or compilation's) tracks belong to it, so a single of one of them is
 * left out, unless it came out before the collection did: a single that
 * led up to the album stands on its own.
 */
export function gridReleases(releases: readonly Release[]): Release[] {
  const bySlug = new Map(releases.map((r) => [r.slug, r]));
  const hidden = new Set<string>();
  for (const collection of releases) {
    if (!COLLECTIONS.has(collection.kind)) continue;
    const collectionTime = releaseTime(collection);
    for (const track of collection.tracks) {
      const single = track.single && bySlug.get(track.single);
      if (!single) continue;
      const singleTime = releaseTime(single);
      const cameFirst =
        singleTime !== null &&
        (collectionTime === null || singleTime < collectionTime);
      if (!cameFirst) hidden.add(single.slug);
    }
  }
  return releases.filter((r) => !hidden.has(r.slug));
}

export type SortKey = 'newest' | 'oldest' | 'title';

export interface Filters {
  kinds: ReleaseKind[];
  years: number[];
}

export const NO_FILTERS: Filters = { kinds: [], years: [] };

export const yearOf = (release: Pick<Release, 'date'>) =>
  release.date ? Number(release.date.slice(0, 4)) : null;

/** What sorting and filtering read: a release, or any summary of one. */
type Sortable = Pick<Release, 'title' | 'kind' | 'date'>;

// Dated releases by date; the undated after them, by title.
function byDate(direction: 1 | -1) {
  return (a: Sortable, b: Sortable) => {
    const ta = releaseTime(a);
    const tb = releaseTime(b);
    if (ta === null && tb === null) return a.title.localeCompare(b.title);
    if (ta === null) return 1;
    if (tb === null) return -1;
    return (ta - tb) * direction || a.title.localeCompare(b.title);
  };
}

export function sortReleases<T extends Sortable>(
  releases: readonly T[],
  sort: SortKey
) {
  const list = [...releases];
  if (sort === 'title')
    return list.sort((a, b) => a.title.localeCompare(b.title));
  return list.sort(byDate(sort === 'newest' ? -1 : 1));
}

/** The releases the filters leave, in the chosen order. */
export function applyFilters<T extends Sortable>(
  releases: readonly T[],
  filters: Filters,
  sort: SortKey
) {
  const kept = releases.filter((r) => {
    if (filters.kinds.length && !filters.kinds.includes(r.kind)) return false;
    if (filters.years.length) {
      const year = yearOf(r);
      if (year === null || !filters.years.includes(year)) return false;
    }
    return true;
  });
  return sortReleases(kept, sort);
}

export const activeFilterCount = (filters: Filters) =>
  filters.kinds.length + filters.years.length;

/** How many releases of each kind, for the kinds that have any. */
export function kindCounts(releases: readonly Pick<Release, 'kind'>[]) {
  const counts = new Map<ReleaseKind, number>();
  for (const r of releases) counts.set(r.kind, (counts.get(r.kind) ?? 0) + 1);
  return counts;
}

/** Every year with a release, newest first. */
export function releaseYears(releases: readonly Pick<Release, 'date'>[]) {
  const years = new Set<number>();
  for (const r of releases) {
    const year = yearOf(r);
    if (year !== null) years.add(year);
  }
  return [...years].sort((a, b) => b - a);
}

/** One-track kinds: what "more singles & remixes" gathers. */
const ONE_TRACK: ReadonlySet<ReleaseKind> = new Set([
  'single',
  'remix',
  'bootleg'
]);

export const isOneTrack = (release: Pick<Release, 'kind'>) =>
  ONE_TRACK.has(release.kind);

/**
 * Releases to go on to from this one: others of its family (singles,
 * remixes and bootlegs; or albums, EPs and compilations) from the grid,
 * newest first.
 */
export function moreLike(
  release: Release,
  catalogue: readonly Release[],
  count = 4
) {
  const family = isOneTrack(release);
  return sortReleases(
    gridReleases(catalogue).filter(
      (r) => r.slug !== release.slug && isOneTrack(r) === family
    ),
    'newest'
  ).slice(0, count);
}
