import type {
  LoreChapter,
  LoreChapterSummary,
  LoreCopy
} from '@/content/lore/lore';

export interface LoreChapterPageProps {
  copy: LoreCopy;
  /** Every chapter, without its text: for the orbit, the menu, the next. */
  chapters: LoreChapterSummary[];
  /** The chapter read here, with its text. */
  chapter: LoreChapter;
}
