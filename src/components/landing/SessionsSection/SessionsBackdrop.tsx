import Image from 'next/image';
import { Frame } from '@/components/common/Frame';
import styles from './SessionsSection.module.scss';
import type { SessionsBackdropProps } from './SessionsSection.types';

// The stage photo behind the section (scroll-parallaxed through Frame on
// desktop), darkened from the top, the left and the bottom so the column of
// copy sits on black while the stage stays clear on the right. On mobile it
// is a band across the top that fades into the list.
export default function SessionsBackdrop({ photo }: SessionsBackdropProps) {
  return (
    <div className={styles.backdrop} data-motion="backdrop">
      <Frame travel={160}>
        <div className={styles.photo} data-motion="photo">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            // Cover-fitted: ~115vw on desktop with the parallax cushion, and
            // a landscape crop in the portrait mobile band renders ~180vw.
            sizes="(min-width: 1024px) 115vw, 180vw"
            className={styles.photoImage}
          />
        </div>
      </Frame>
      <span className={styles.fadeTop} aria-hidden="true" />
      <span
        className={styles.fadeLeft}
        data-motion="fade-left"
        aria-hidden="true"
      />
      <span className={styles.fadeBottom} aria-hidden="true" />
    </div>
  );
}
