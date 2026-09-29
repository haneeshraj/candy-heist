import Image from 'next/image';
import { VortexMark } from '@/components/common/VortexMark';
import type { AboutPhoto } from '@/content/about/about';
import styles from './AboutBanner.module.scss';

interface AboutBannerProps {
  name: string;
  photo: AboutPhoto;
  className?: string;
}

// Figma "Banner (sticky, 360)": the photo under a fade, the gold vortex and
// the name, and a tick ruler along the bottom edge that the crimson lock
// point rides as the reading progress. The frame the orb became on the way
// down widens into this. Decorative: the page's heading is elsewhere.
export default function AboutBanner({
  name,
  photo,
  className
}: AboutBannerProps) {
  return (
    <div
      className={className ? `${styles.banner} ${className}` : styles.banner}
      data-motion="banner"
      aria-hidden="true"
    >
      <div className={styles.photoClip}>
        <div className={styles.photo} data-motion="banner-photo">
          <Image
            src={photo.src}
            alt=""
            fill
            sizes="100vw"
            className={styles.photoImage}
          />
        </div>
        <span className={styles.fade} data-motion="banner-fade" />
      </div>
      <span className={styles.underFade} />

      <div className={styles.inner}>
        <span className={styles.logo} data-motion="banner-logo">
          <VortexMark />
        </span>
        <span className={styles.name} data-motion="banner-name">
          {name}
        </span>
      </div>

      <span className={styles.ruler} />
      <span className={styles.edge} />
      <span className={styles.travelled} data-motion="banner-travelled" />
      <span className={styles.lock} data-motion="banner-lock">
        <span className={styles.lockRing} />
        <span className={styles.lockPoint} />
      </span>
    </div>
  );
}
