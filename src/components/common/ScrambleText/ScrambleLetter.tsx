'use client';

import { useEffect, useRef } from 'react';
import { useScramble } from 'use-scramble';
import styles from './ScrambleText.module.scss';
import type { ScrambleLetterProps } from './ScrambleText.types';

export default function ScrambleLetter({
  char,
  index,
  className,
  scrambleOptions,
  registerLetter
}: ScrambleLetterProps) {
  const innerRef = useRef<HTMLSpanElement | null>(null);

  const { ref, replay } = useScramble({
    text: char,
    playOnMount: false,
    speed: scrambleOptions?.speed ?? 0.6,
    tick: scrambleOptions?.tick ?? 2,
    step: scrambleOptions?.step ?? 1,
    scramble: scrambleOptions?.scramble ?? 6,
    seed: scrambleOptions?.seed ?? 2,
    chance: scrambleOptions?.chance,
    range: scrambleOptions?.range ?? [65, 125]
  });

  useEffect(() => {
    registerLetter(index, innerRef.current, replay);
    return () => registerLetter(index, null, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, replay]);

  if (char === ' ') {
    return (
      <span aria-hidden="true" className={styles.space}>
        {' '}
      </span>
    );
  }

  return (
    <span aria-hidden="true" className={styles.mask}>
      <span
        ref={(node) => {
          innerRef.current = node;
          ref.current = node;
        }}
        className={`${styles.letter}${className ? ` ${className}` : ''}`}
      >
        {char}
      </span>
    </span>
  );
}
