import Image from 'next/image';
import { Frame } from '@/components/common/Frame';
import styles from './AboutSection.module.scss';
import type { AboutArchProps } from './AboutSection.types';
import { ARCH_VIEWBOX, RIBS } from './aboutDecor';

// The monument: the arched photo (scroll-parallaxed through Frame on
// desktop), two outlines drawn down from the keystone, the flanking
// pilasters and the floor line it stands on.
export default function AboutArch({ photo }: AboutArchProps) {
  return (
    <div className={styles.archColumn}>
      <svg
        className={styles.ribs}
        viewBox={ARCH_VIEWBOX}
        aria-hidden="true"
        focusable="false"
      >
        {RIBS.map((rib) =>
          rib.halves.map((d, i) => (
            <path
              key={`${rib.id}-${i}`}
              d={d}
              pathLength={1}
              strokeOpacity={rib.opacity}
              data-motion={`rib-${rib.id}`}
            />
          ))
        )}
      </svg>

      <span
        className={`${styles.pilaster} ${styles.pilasterLeft}`}
        data-motion="pilaster"
        aria-hidden="true"
      />
      <span
        className={`${styles.pilaster} ${styles.pilasterRight}`}
        data-motion="pilaster"
        aria-hidden="true"
      />

      <div className={styles.arch} data-motion="arch">
        <Frame travel={120}>
          <div className={styles.photo} data-motion="photo">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              // A landscape photo cover-fitted into a portrait arch renders
              // far wider than the arch (~80vw desktop incl. the parallax
              // cushion, ~150vw mobile), so size for that, not the box.
              sizes="(min-width: 1024px) 85vw, 150vw"
              className={styles.photoImage}
            />
          </div>
        </Frame>
        <span className={styles.veil} data-motion="veil" aria-hidden="true" />
      </div>

      <span className={styles.floor} data-motion="floor" aria-hidden="true" />
    </div>
  );
}
