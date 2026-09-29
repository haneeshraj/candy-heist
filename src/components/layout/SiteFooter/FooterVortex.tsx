import Image from 'next/image';
import { VortexMark } from '@/components/common/VortexMark';
import styles from './SiteFooter.module.scss';
import type { FooterVortexProps } from './SiteFooter.types';

// One file draws both the fill's mask (in the stylesheet) and the hairline
// edge (VortexMark below), so the two can never drift apart.

// The vortex mark with the photo poured into it: a gilt duotone clipped to
// the logo, a hairline tracing its edge, and the crimson eye at its centre.
export default function FooterVortex({ photo }: FooterVortexProps) {
  return (
    <div className={styles.vortex} data-motion="vortex">
      <div className={styles.vortexFill}>
        <div className={styles.vortexPhoto} data-motion="vortex-photo">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            // 1300 dp wide on the 1440 frame, 600 dp on the 390 one (with
            // --dp capped at 1px and 1.2px respectively).
            sizes="(min-width: 1440px) 1300px, (min-width: 1024px) 91vw, (min-width: 468px) 720px, 154vw"
            className={styles.vortexImage}
          />
        </div>
      </div>
      <VortexMark className={styles.vortexEdge} />
      <span className={styles.eye} data-motion="eye" aria-hidden="true" />
    </div>
  );
}
