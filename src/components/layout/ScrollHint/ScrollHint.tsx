'use client';

import { useSyncExternalStore } from 'react';
import { ChevronDownIcon } from '@/components/icons';
import { getAtPageEnd, subscribeAtPageEnd } from '@/lib/scroll/pageEnd';
import styles from './ScrollHint.module.scss';

export interface ScrollHintProps {
  /** The words either side of the navbar: "Scroll", "for more". */
  copy: { lead: string; trail: string };
}

const never = () => false;

// Either side of the navbar's pill, a word over a small chevron ("Scroll",
// "for more"), shown only while a page rests at its end with the footer
// still under it (lib/scroll/pageEnd): there's more below, one more scroll
// away. Decorative; scrolling is the way on.
export default function ScrollHint({ copy }: ScrollHintProps) {
  const shown = useSyncExternalStore(subscribeAtPageEnd, getAtPageEnd, never);

  return (
    <div className={styles.hint} data-shown={shown || undefined} aria-hidden>
      {(['lead', 'trail'] as const).map((side) => (
        <span key={side} className={styles.side} data-side={side}>
          <span className={styles.word}>{copy[side]}</span>
          <ChevronDownIcon className={styles.chevron} />
        </span>
      ))}
    </div>
  );
}
