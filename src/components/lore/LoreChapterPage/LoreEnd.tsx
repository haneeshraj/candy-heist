'use client';

import { useId } from 'react';
import { SigilChip } from '@/components/common/SigilChip';
import { WordReveal } from '@/components/common/WordReveal';
import { ArrowIcon } from '@/components/icons';
import type { LoreCopy } from '@/content/lore/lore';
import { toRoman } from '@/lib/text/roman';
import styles from './LoreChapterPage.module.scss';

interface LoreEndProps {
  copy: LoreCopy['end'];
  all: string;
  total: number;
}

// Figma "Lore A · 7", under the last chapter: every chapter read, and the
// one still being written, which is where a new chapter lands.
export default function LoreEnd({ copy, all, total }: LoreEndProps) {
  const headingId = useId();

  return (
    <section
      className={styles.end}
      aria-labelledby={headingId}
      data-motion="next"
    >
      <p className={styles.nextRead}>
        {copy.label.replace('{total}', toRoman(total))}
      </p>
      <h2 id={headingId} className={styles.endLine}>
        <WordReveal
          text={copy.line.replace(/\n/g, ' ')}
          trigger="inView"
          staggerDelay={0.06}
        />
      </h2>
      <WordReveal
        as="p"
        className={styles.epigraph}
        text={copy.epigraph}
        trigger="inView"
        startDelay={0.4}
        staggerDelay={0.02}
      />
      <div className={styles.ctas}>
        <SigilChip variant="solid" href={copy.listen.href} icon={<ArrowIcon />}>
          {copy.listen.label}
        </SigilChip>
        <SigilChip variant="ghost" href="/lore" icon={null}>
          {all}
        </SigilChip>
      </div>
    </section>
  );
}
