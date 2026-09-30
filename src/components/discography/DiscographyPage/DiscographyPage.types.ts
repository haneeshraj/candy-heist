import type { DiscographyCopy } from '@/content/discography/discography';
import type { ReleaseSummary } from '@/lib/discography/summary';

export interface DiscographyPageProps {
  copy: DiscographyCopy['page'];
  /** The releases with a place in the grid, as the lists show them. */
  releases: ReleaseSummary[];
}
