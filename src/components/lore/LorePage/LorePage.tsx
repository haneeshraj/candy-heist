'use client';

import { useId, useRef, useState } from 'react';
import { useScrollRefresh } from '@/hooks/useScrollRefresh';
import { LoreStage } from '../LoreStage';
import LoreArrival from './LoreArrival';
import LoreIndex from './LoreIndex';
import styles from './LorePage.module.scss';
import type { LorePageProps } from './LorePage.types';
import { useLoreMotion } from './useLoreMotion';

// Figma "LORE PAGE — A · Orrery", the way in: the arrival, then the
// chapters round the orbit, each a link to its own page. Everything comes
// from the lore content, so a chapter added there (or, later, from Candy
// Haven) gets its node, its numeral and its page.
export default function LorePage({ copy, chapters }: LorePageProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const headingId = useId();
  const [selected, setSelected] = useState(0);

  useScrollRefresh(rootRef);
  useLoreMotion(rootRef);

  return (
    <div ref={rootRef} className={styles.lore}>
      <LoreStage
        layout="index"
        chapters={chapters}
        copy={copy.index}
        selected={selected}
        onSelect={setSelected}
      />

      <LoreArrival
        copy={copy.intro}
        headingId={headingId}
        look={chapters[0].state}
      />
      <LoreIndex
        copy={copy.index}
        intro={copy.intro}
        chapters={chapters}
        selected={selected}
        onSelect={setSelected}
      />
    </div>
  );
}
