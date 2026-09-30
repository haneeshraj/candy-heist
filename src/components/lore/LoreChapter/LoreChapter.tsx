'use client';

import type { CSSProperties } from 'react';
import { useRef } from 'react';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { NayaraPlanet } from '@/components/common/NayaraPlanet';
import { WordReveal } from '@/components/common/WordReveal';
import type { LoreBlock, LoreChapter as Chapter } from '@/content/lore/lore';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { titleSize } from '@/lib/text/titleSize';
import LoreText, { Runs } from './LoreText';
import styles from './LoreChapter.module.scss';

interface LoreChapterProps {
  chapter: Chapter;
  /** Its numeral out of how many, e.g. "II / XI". */
  position: string;
  chapterWord: string;
}

function Block({ block }: { block: LoreBlock }) {
  switch (block.kind) {
    case 'paragraph':
      return (
        <LoreText
          className={styles.paragraph}
          runs={block.runs}
          staggerDelay={0.012}
          wordDuration={0.8}
        />
      );
    case 'quote':
      return (
        <blockquote className={styles.quote} data-motion="block">
          <LoreText runs={block.runs} staggerDelay={0.05} />
        </blockquote>
      );
    case 'heading':
      return (
        <h2 className={styles.heading}>
          <span className={styles.srOnly}>{block.text}</span>
          <span aria-hidden="true">
            <ClipRevealText text={block.text} trigger="inView" />
          </span>
        </h2>
      );
    case 'list':
      return (
        <ul className={styles.list} data-motion="block">
          {block.items.map((runs, i) => (
            <li key={i} className={styles.item} data-reveal>
              <Runs runs={runs} />
            </li>
          ))}
        </ul>
      );
    case 'entries':
      return (
        <dl className={styles.entries} data-motion="block">
          {block.items.map((item) => (
            <div key={item.term} className={styles.entry} data-reveal>
              <dt className={styles.term}>{item.term}</dt>
              <dd className={styles.entryText}>
                <Runs runs={item.runs} />
              </dd>
            </div>
          ))}
        </dl>
      );
  }
}

// One chapter, Figma "Lore A · 2" and "3": its numeral, title and line as
// a title card, then the text, which reveals as it's read. On desktop it
// runs down the right of the page with the orrery holding the left;
// stacked, the chapter opens on a still of the planet in its look.
export default function LoreChapter({
  chapter,
  position,
  chapterWord
}: LoreChapterProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  useScrollReveal(rootRef);
  const headingId = `${chapter.slug}-title`;

  return (
    <article
      ref={rootRef}
      className={styles.chapter}
      aria-labelledby={headingId}
      data-motion="chapter"
      style={
        {
          '--title-size': titleSize(chapter.title, 644, 112),
          '--title-size-sm': titleSize(chapter.title, 342, 96)
        } as CSSProperties
      }
    >
      <header className={styles.header}>
        <div className={styles.figure}>
          <NayaraPlanet
            layers={[{ state: chapter.state, render: chapter.render }]}
          />
        </div>
        <p className={styles.numeral}>
          {chapterWord} {position}
        </p>
        <h1 id={headingId} className={styles.title}>
          <span className={styles.srOnly}>{chapter.title}</span>
          <span aria-hidden="true">
            <ClipRevealText text={chapter.title} trigger="mount" />
          </span>
        </h1>
        <WordReveal
          as="p"
          className={styles.line}
          text={chapter.line}
          trigger="mount"
          startDelay={0.5}
          staggerDelay={0.05}
        />
      </header>

      <div className={styles.body} data-motion="body">
        {chapter.blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>
    </article>
  );
}
