import type { DiscographyCopy } from '@/content/discography/discography';
import type { Release } from '@/content/discography/releases';
import type { ReleaseSummary } from '@/lib/discography/summary';

export interface ReleasePageProps {
  copy: DiscographyCopy['release'];
  /** "Forthcoming", for the releases under it that aren't out. */
  forthcoming: string;
  release: Release;
  /** Releases to go on to (see lib/discography/catalogue moreLike). */
  more: ReleaseSummary[];
  /** When the server made the page: the clock's first reading. */
  renderedAt: number;
}
