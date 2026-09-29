'use client';

import { AnimatePresence, motion } from 'motion/react';
import { EASE_SWAP } from './navbarMotion';
import styles from './SiteNavbar.module.scss';

const LETTER = { duration: 0.3, ease: EASE_SWAP };
const STAGGER = 0.05;

// The pill's middle word. When it changes (MENU on open, or a new page) the
// old letters rise out one after another and each new letter rises in once
// the old one in its place has gone. Both words share one grid cell rather
// than waiting on each other, so quick changes (closing the menu while the
// route changes) always land on the latest word.
export default function NavbarLabel({ text }: { text: string }) {
  return (
    <span className={styles.labelClip} aria-hidden="true">
      <AnimatePresence>
        <motion.span key={text} className={styles.labelText}>
          {[...text].map((char, i) => (
            <motion.span
              key={i}
              className={styles.labelChar}
              initial={{ y: '100%' }}
              animate={{
                y: 0,
                transition: { ...LETTER, delay: LETTER.duration + i * STAGGER }
              }}
              exit={{
                y: '-100%',
                transition: { ...LETTER, delay: i * STAGGER }
              }}
            >
              {char === ' ' ? ' ' : char}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
