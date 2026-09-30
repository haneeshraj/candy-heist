'use client';

import { useEffect, useMemo, useRef, type ElementType } from 'react';
import {
  RichWordReveal,
  type RichWordRevealHandle
} from '@/components/common/RichWordReveal';
import type { LoreRun } from '@/content/lore/lore';
import { useInView } from '@/hooks/useInView';
import styles from './LoreChapter.module.scss';

interface LoreTextProps {
  runs: LoreRun[];
  as?: ElementType;
  className?: string;
  staggerDelay?: number;
  wordDuration?: number;
}

// A passage in its voices (the markdown's *emphasis* and **strong**),
// rising word by word once it scrolls into view.
export default function LoreText({
  runs,
  as = 'p',
  className,
  staggerDelay,
  wordDuration
}: LoreTextProps) {
  const revealRef = useRef<RichWordRevealHandle | null>(null);
  const { ref, inView } = useInView<HTMLDivElement>();
  const segments = useMemo(
    () =>
      runs.map(({ text, voice }) => ({
        text,
        emphasis: voice === 'emphasis',
        strong: voice === 'strong'
      })),
    [runs]
  );

  useEffect(() => {
    if (inView) void revealRef.current?.play();
  }, [inView]);

  return (
    <div ref={ref}>
      <RichWordReveal
        ref={revealRef}
        as={as}
        className={className}
        segments={segments}
        emphasisClassName={styles.emphasis}
        strongClassName={styles.strong}
        staggerDelay={staggerDelay}
        wordDuration={wordDuration}
      />
    </div>
  );
}

/** The same voices, without the reveal (list items, entries). */
export function Runs({ runs }: { runs: LoreRun[] }) {
  return runs.map(({ text, voice }, i) =>
    voice ? (
      <span
        key={i}
        className={voice === 'emphasis' ? styles.emphasis : styles.strong}
      >
        {text}
      </span>
    ) : (
      text
    )
  );
}
