import type { DiscographyCopy } from '@/content/discography/discography';
import type { Release } from '@/content/discography/releases';
import type { ReleaseSummary } from '@/lib/discography/summary';

export interface ReleasePageProps {
  copy: DiscographyCopy['release'];
  /** "Forthcoming", for the releases under it that aren't out. */
  forthcoming: string;
  release: Release;
  /**
   * On a track's own page: its place in the release's running order, from
   * 1 (see lib/discography/tracks). The page is of the track, then.
   */
  position?: number;
  /** The releases that carry this one: the albums a single is also on. */
  alsoOn?: Array<Pick<Release, 'slug' | 'title'>>;
  /** Releases to go on to (see lib/discography/catalogue moreLike). */
  more: ReleaseSummary[];
  /** When the server made the page: the clock's first reading. */
  renderedAt: number;
}
