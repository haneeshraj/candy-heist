'use client';

import { motion, useReducedMotion } from 'motion/react';
import { groupWords } from '@/lib/text/groupWords';
import styles from './MotionText.module.scss';
import type { MotionTextProps } from './MotionText.types';
import { EASE_RISE } from './easing';

// Letter by letter, each rising 50px into place as it fades in. Ported from
// the AnimateText set in Haneesh Raj's portfolio. Built on motion, so it
// plays on mount: meant for UI that mounts on demand, like a menu opening.
export default function LetterUp({
  text,
  as: Tag = 'span',
  className,
  delay = 0,
  stagger = 0.1,
  duration = 0.7,
  ease = EASE_RISE
}: MotionTextProps) {
  const reduced = useReducedMotion();
  const groups = groupWords([...text]);

  return (
    <Tag className={className ? `${styles.text} ${className}` : styles.text}>
      <span className={styles.srOnly}>{text}</span>
      <span aria-hidden="true">
        {groups.map((group) =>
          group.kind === 'space' ? (
            <span key={`space-${group.index}`} className={styles.space}>
              {' '}
            </span>
          ) : (
            <span key={`word-${group.start}`} className={styles.word}>
              {group.chars.map((char, i) => (
                <motion.span
                  key={i}
                  className={styles.piece}
                  initial={reduced ? false : { y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: delay + (group.start + i) * stagger,
                    duration,
                    ease
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </span>
          )
        )}
      </span>
    </Tag>
  );
}
