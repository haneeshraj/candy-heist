'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useLayoutEffect, useRef } from 'react';
import styles from './DiscographySection.module.scss';

// At most this share of the shelf's width, however long the title.
const CAP = 0.87;
const EASE = [0.64, 0, 0, 0.97] as const;

// The lifted release's title, huge in a gilt outline behind the shelf. It
// changes as the row moves: the old word fades out, then the new one
// settles in (in turn, so two outlines never tangle).
export default function ShelfMonument({ title }: { title: string }) {
  return (
    <div className={styles.monument} aria-hidden="true" data-reveal>
      <AnimatePresence initial={false} mode="wait">
        <MonumentWord key={title} text={title} />
      </AnimatePresence>
    </div>
  );
}

// Sized to fit: at full size unless that would run past the cap.
function MonumentWord({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useLayoutEffect(() => {
    const word = ref.current;
    // The word sits in the monument, which fills the shelf.
    const box = word?.parentElement?.parentElement;
    if (!word || !box) return;
    const fit = () => {
      word.style.setProperty('--fit', '1');
      const cap = box.clientWidth * CAP;
      word.style.setProperty(
        '--fit',
        String(Math.min(1, cap / Math.max(1, word.scrollWidth)))
      );
    };
    fit();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [text]);

  return (
    <motion.span
      ref={ref}
      className={styles.monumentWord}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{
        opacity: 1,
        scale: 1,
        transition: { duration: 0.7, ease: EASE }
      }}
      exit={{
        opacity: 0,
        scale: 1.02,
        transition: { duration: 0.3, ease: EASE }
      }}
    >
      {text}
    </motion.span>
  );
}
