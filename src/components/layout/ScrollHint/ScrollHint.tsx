'use client';

import { useSyncExternalStore } from 'react';
import { ChevronDownIcon } from '@/components/icons';
import { getAtPageEnd, subscribeAtPageEnd } from '@/lib/scroll/pageEnd';
import styles from './ScrollHint.module.scss';

const never = () => false;

// A small chevron over the navbar, shown only while a page rests at its
// end with the footer still under it (lib/scroll/pageEnd): there's more
// below, one more scroll away. Decorative; scrolling is the way on.
export default function ScrollHint() {
  const shown = useSyncExternalStore(subscribeAtPageEnd, getAtPageEnd, never);

  return (
    <div className={styles.hint} data-shown={shown || undefined} aria-hidden>
      <ChevronDownIcon className={styles.chevron} />
    </div>
  );
}
