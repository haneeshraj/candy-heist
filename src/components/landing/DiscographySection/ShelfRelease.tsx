'use client';

import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';
import styles from './DiscographySection.module.scss';
import type { ShelfReleaseProps } from './DiscographySection.types';

const EASE = [0.64, 0, 0, 0.97] as const;

// The lifted release, top right on desktop: its cover, title and artist.
// On each change the covers crossfade; the lines lift away, then the new
// ones rise in (in turn, so two titles never overlap).
export default function ShelfRelease({ release }: ShelfReleaseProps) {
  return (
    <div className={styles.release} data-reveal>
      <div className={styles.releaseCover}>
        <AnimatePresence initial={false}>
          <motion.div
            key={release.slug}
            className={styles.releaseCoverImage}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <Image
              src={release.cover.src}
              alt={release.cover.alt}
              fill
              sizes="(min-width: 1024px) 124px, 72px"
            />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className={styles.releaseText}>
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={release.slug}
            className={styles.releaseLines}
            initial={{ opacity: 0, y: 12 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: 0.45, ease: EASE }
            }}
            exit={{
              opacity: 0,
              y: -10,
              transition: { duration: 0.22, ease: EASE }
            }}
          >
            <p className={styles.releaseTitle}>{release.title}</p>
            <p className={styles.releaseArtist}>{release.artist}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
