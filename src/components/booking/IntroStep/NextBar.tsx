'use client';

import { useRef, type ReactNode } from 'react';
import { ScrambleText } from '@/components/common/ScrambleText';
import { useEntrance } from '@/hooks/useEntrance';
import styles from './IntroStep.module.scss';

const CAPITALS = { range: [65, 90] as [number, number] };

// Slides in once a session is picked: what's selected, and the way on. The
// label decodes again each time the pick changes.
export default function NextBar({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEntrance(rootRef, { y: 20 });

  return (
    <div ref={rootRef} className={styles.nextBar}>
      <span className={styles.nextRule} data-enter aria-hidden="true" />
      <p className={styles.selection} data-enter>
        <span className={styles.srOnly}>{label}</span>
        <span aria-hidden="true">
          <ScrambleText
            key={label}
            text={label}
            trigger="mount"
            staggerDelay={0.02}
            letterDuration={0.6}
            scramble={CAPITALS}
          />
        </span>
      </p>
      <span className={styles.nextAction} data-enter>
        {children}
      </span>
    </div>
  );
}
