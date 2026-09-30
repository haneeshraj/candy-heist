'use client';

import type { CSSProperties } from 'react';
import { useId } from 'react';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { SigilChip } from '@/components/common/SigilChip';
import { WordReveal } from '@/components/common/WordReveal';
import { ArrowIcon } from '@/components/icons';
import {
  chapterHref,
  type LoreChapterSummary,
  type LoreCopy
} from '@/content/lore/lore';
import { titleSize } from '../titleSize';
import styles from './LoreChapterPage.module.scss';

interface LoreNextProps {
  copy: LoreCopy['reader'];
  /** The chapter just read. */
  read: LoreChapterSummary;
  next: LoreChapterSummary;
}

// Under a chapter: that it's read, and the one that comes next, to go on
// to or to go back to the chapters from.
export default function LoreNext({ copy, read, next }: LoreNextProps) {
  const headingId = useId();
  const numeral = (n: string) => copy.nextChapter.replace('{numeral}', n);

  return (
    <nav
      className={styles.next}
      aria-labelledby={headingId}
      data-motion="next"
      style={
        {
          '--next-size': titleSize(next.title, 644, 72),
          '--next-size-sm': titleSize(next.title, 342, 52)
        } as CSSProperties
      }
    >
      <p className={styles.nextRead}>
        {copy.read.replace('{numeral}', read.numeral)}
      </p>
      <p className={styles.nextLabel}>
        {copy.next} · {numeral(next.numeral)}
      </p>
      <h2 id={headingId} className={styles.nextTitle}>
        <span className={styles.srOnly}>
          {copy.next}: {next.title}
        </span>
        <span aria-hidden="true">
          <ClipRevealText text={next.title} trigger="inView" />
        </span>
      </h2>
      <WordReveal
        as="p"
        className={styles.nextLine}
        text={next.line}
        trigger="inView"
        startDelay={0.3}
        staggerDelay={0.05}
      />
      <div className={styles.ctas}>
        <SigilChip
          variant="solid"
          href={chapterHref(next.slug)}
          icon={<ArrowIcon />}
        >
          {copy.next}
        </SigilChip>
        <SigilChip variant="ghost" href="/lore" icon={null}>
          {copy.all}
        </SigilChip>
      </div>
    </nav>
  );
}
