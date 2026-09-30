'use client';

import Link from 'next/link';
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
import styles from './LorePage.module.scss';

interface LoreIndexProps {
  copy: LoreCopy['index'];
  intro: LoreCopy['intro'];
  chapters: LoreChapterSummary[];
  selected: number;
  onSelect: (index: number) => void;
}

// Figma "Lore A · 1": the chapters, each a link to its page. On desktop
// the orbit behind is the list (its nodes are the links) and this is the
// preview of the one hovered; the stacked page lists them here instead.
export default function LoreIndex({
  copy,
  intro,
  chapters,
  selected,
  onSelect
}: LoreIndexProps) {
  const headingId = useId();
  const chapter = chapters[selected];
  const statement = intro.statement.split('\n');

  return (
    <section
      className={styles.index}
      aria-labelledby={headingId}
      data-motion="index"
    >
      <div className={styles.pin}>
        <div className={styles.frame}>
          <h2 id={headingId} className={styles.srOnly}>
            {copy.label}
          </h2>
          <div className={styles.indexHead} aria-hidden="true">
            <p className={styles.indexLabel}>{intro.label}</p>
            <p className={styles.indexLead}>{intro.lead}</p>
            <p className={styles.indexStatement}>
              {statement.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>
          </div>

          {/* Keyed, so each preview writes itself in afresh. */}
          <div
            key={chapter.slug}
            className={styles.preview}
            style={
              {
                '--preview-size': titleSize(chapter.title, 360, 64)
              } as CSSProperties
            }
          >
            <p className={styles.previewNumeral}>
              {copy.chapter} {chapter.numeral}
            </p>
            <p className={styles.previewTitle}>
              <ClipRevealText text={chapter.title} trigger="mount" />
            </p>
            <WordReveal
              as="p"
              className={styles.previewLine}
              text={chapter.line}
              trigger="mount"
              startDelay={0.2}
              staggerDelay={0.04}
            />
            <span className={styles.previewCta}>
              <SigilChip href={chapterHref(chapter.slug)} icon={<ArrowIcon />}>
                {copy.read}
              </SigilChip>
            </span>
          </div>

          <p className={styles.count}>
            {copy.count.replace('{count}', String(chapters.length))}
          </p>

          {/* The stacked page's list; on desktop, the orbit is it. */}
          <ol className={styles.list}>
            {chapters.map((c) => (
              <li key={c.slug} data-reveal>
                <Link
                  className={styles.listLink}
                  href={chapterHref(c.slug)}
                  onFocus={() => onSelect(c.index)}
                >
                  <span className={styles.listNumeral}>{c.numeral}</span>
                  <span className={styles.listTitle}>{c.title}</span>
                  <span className={styles.listLine}>{c.line}</span>
                </Link>
              </li>
            ))}
            <li className={styles.listNext} aria-hidden="true">
              <span className={styles.listNumeral} />
              <span className={styles.listUnwritten}>{copy.unwritten}</span>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
