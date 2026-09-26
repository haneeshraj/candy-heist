'use client';

import { Frame } from '@/components/common/Frame';
import { DepthImage } from '@/components/common/DepthImage';
import { ScrambleText } from '@/components/common/ScrambleText';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { FINE_POINTER_QUERY } from '@/lib/constants/breakpoints';
import styles from './LandingHero.module.scss';

export default function LandingHero() {
  const hasFinePointer = useMediaQuery(FINE_POINTER_QUERY);
  const reducedMotion = useReducedMotion();

  return (
    <section className={styles.hero}>
      <Frame className={styles.frame} travel={200}>
        <DepthImage
          colorSrc="/img/home/landing-photo.jpeg"
          depthSrc="/img/home/landing-depth-map.jpeg"
          enabled={hasFinePointer}
          interactive={hasFinePointer && !reducedMotion}
          focalY={0.52}
          strength={3}
        />
      </Frame>

      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.chrome}>
        <ClipRevealText
          as="p"
          text="EST. 2018"
          trigger="inView"
          className={styles.chromeText}
        />
        <span className={styles.hairline} aria-hidden="true" />
        <ClipRevealText
          as="p"
          text="HALIFAX · NOVA SCOTIA"
          trigger="inView"
          className={styles.chromeText}
        />
      </div>

      <div className={styles.wordmark}>
        <ScrambleText
          as="h1"
          text="CANDY HEIST"
          trigger="inView"
          scrambleEnabled={false}
          className={styles.heading}
        />
        <ClipRevealText
          as="p"
          text="DJ . PRODUCER"
          trigger="inView"
          className={styles.subheading}
        />
      </div>
    </section>
  );
}
