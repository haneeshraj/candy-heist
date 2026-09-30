import type { LoreChapterSummary, LoreCopy } from '@/content/lore/lore';

export interface LorePageProps {
  copy: LoreCopy;
  /** Every chapter, without its text: the index only links to them. */
  chapters: LoreChapterSummary[];
}
