'use client';

import { Fragment } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import styles from './MotionText.module.scss';
import type { MotionTextProps } from './MotionText.types';
import { EASE_RISE } from './easing';

// LetterUp's word-by-word sibling, for short lines of running text. Ported
// from the AnimateText set in Haneesh Raj's portfolio; plays on mount.
export default function WordUp({
  text,
  as: Tag = 'span',
  className,
  delay = 0,
  stagger = 0.1,
  duration = 0.7,
  ease = EASE_RISE
}: MotionTextProps) {
  const reduced = useReducedMotion();
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <Tag className={className ? `${styles.text} ${className}` : styles.text}>
      <span className={styles.srOnly}>{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <Fragment key={i}>
            {i > 0 ? ' ' : null}
            <motion.span
              className={styles.piece}
              initial={reduced ? false : { y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: delay + i * stagger, duration, ease }}
            >
              {word}
            </motion.span>
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}
