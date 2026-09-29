'use client';

import { motion, useReducedMotion } from 'motion/react';
import { groupWords } from '@/lib/text/groupWords';
import styles from './MotionText.module.scss';
import type { WordBlockRevealProps } from './MotionText.types';
import { EASE_RISE, EASE_SWEEP } from './easing';

const BLOCK_HIDDEN_LEFT = 'polygon(0 0, 0 0, 0 100%, 0 100%)';
const BLOCK_FULL = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';
const BLOCK_HIDDEN_RIGHT = 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)';

// A block sweeps across the text and off again; the letters rise into place
// behind it, each a touch slower than the last. Ported from the AnimateText
// set in Haneesh Raj's portfolio (timings unchanged); plays on mount. With
// reduced motion it's just the text.
export default function WordBlockReveal({
  text,
  as: Tag = 'span',
  className,
  delay = 0,
  stagger = 0.1,
  duration = 0.7,
  ease = EASE_RISE,
  blockColor = 'var(--color-gilt)'
}: WordBlockRevealProps) {
  const reduced = useReducedMotion();
  const groups = groupWords([...text]);
  const classes = className ? `${styles.text} ${className}` : styles.text;

  if (reduced) return <Tag className={classes}>{text}</Tag>;

  return (
    <Tag className={classes}>
      <span className={styles.srOnly}>{text}</span>
      <motion.span
        className={styles.block}
        style={{ backgroundColor: blockColor }}
        aria-hidden="true"
        initial={{ clipPath: BLOCK_HIDDEN_LEFT }}
        animate={{
          clipPath: [BLOCK_HIDDEN_LEFT, BLOCK_FULL, BLOCK_HIDDEN_RIGHT]
        }}
        transition={{ delay, duration: duration + 1.5, ease: EASE_SWEEP }}
      />
      <span aria-hidden="true">
        {groups.map((group) =>
          group.kind === 'space' ? (
            <span key={`space-${group.index}`} className={styles.space}>
              {' '}
            </span>
          ) : (
            <span key={`word-${group.start}`} className={styles.word}>
              {group.chars.map((char, i) => {
                const index = group.start + i;
                return (
                  <motion.span
                    key={i}
                    className={styles.piece}
                    initial={{ y: '100%' }}
                    animate={{ y: ['100%', '100%', '0%'] }}
                    transition={{
                      delay: 0.1 + delay + index * stagger,
                      duration: duration + index * 0.08,
                      ease
                    }}
                  >
                    {char}
                  </motion.span>
                );
              })}
            </span>
          )
        )}
      </span>
    </Tag>
  );
}
