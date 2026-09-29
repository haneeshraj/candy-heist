'use client';

import { AnimatePresence, motion } from 'motion/react';
import { EASE_DRAW } from './navbarMotion';
import styles from './SiteNavbar.module.scss';

const LINE_DELAYS = [0.3, 0.4, 0.5];
const CROSS_DELAYS = [0.3, 0.2];
const DRAWN = '1.8rem';

// Three lines closed, a cross open. Each line draws across from zero width,
// and the outgoing shape draws back out at the same time.
export default function NavbarToggle({ open }: { open: boolean }) {
  const delays = open ? CROSS_DELAYS : LINE_DELAYS;

  return (
    <AnimatePresence>
      <motion.span key={open ? 'cross' : 'lines'} className={styles.toggleIcon}>
        {delays.map((delay, i) => (
          <motion.span
            key={i}
            className={open ? styles.crossLine : styles.line}
            data-line={i}
            initial={{ width: 0 }}
            animate={{ width: DRAWN }}
            exit={{ width: 0 }}
            transition={{ duration: 0.6, delay, ease: EASE_DRAW }}
          />
        ))}
      </motion.span>
    </AnimatePresence>
  );
}
