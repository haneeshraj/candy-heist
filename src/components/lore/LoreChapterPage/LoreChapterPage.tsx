'use client';

import { useRef } from 'react';
import { useScrollRefresh } from '@/hooks/useScrollRefresh';
import { toRoman } from '@/lib/text/roman';
import { LoreChapter } from '../LoreChapter';
import { LoreMenu } from '../LoreMenu';
import { LoreStage } from '../LoreStage';
import LoreEnd from './LoreEnd';
import LoreNext from './LoreNext';
import styles from './LoreChapterPage.module.scss';
import type { LoreChapterPageProps } from './LoreChapterPage.types';
import { useChapterMotion } from './useChapterMotion';

// Figma "Lore A · 2" to "7", a page per chapter: Nayara on the left in
// the chapter's look, the orbit round her with this chapter at its crown
// (every node a link to its chapter), the text down the right, and under
// it the next chapter, or on the last, the end. The menu top right lists
// every chapter.
export default function LoreChapterPage({
  copy,
  chapters,
  chapter
}: LoreChapterPageProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const count = chapters.length;
  const next = chapters[chapter.index + 1];

  useScrollRefresh(rootRef);
  useChapterMotion(rootRef, chapter.index, count);

  return (
    <div ref={rootRef} className={styles.page}>
      <LoreStage
        layout="reader"
        chapters={chapters}
        copy={copy.index}
        current={chapter.index}
      />

      <div className={styles.column}>
        <LoreChapter
          chapter={chapter}
          chapterWord={copy.index.chapter}
          position={`${chapter.numeral} / ${toRoman(count)}`}
        />
        {next ? (
          <LoreNext copy={copy.reader} read={chapter} next={next} />
        ) : (
          <LoreEnd copy={copy.end} all={copy.reader.all} total={count} />
        )}
      </div>

      <LoreMenu copy={copy.menu} chapters={chapters} current={chapter.index} />
    </div>
  );
}
