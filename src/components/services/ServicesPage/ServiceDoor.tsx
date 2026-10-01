import Image from 'next/image';
import Link from 'next/link';
import { Frame } from '@/components/common/Frame';
import { SigilChip } from '@/components/common/SigilChip';
import { VortexMark } from '@/components/common/VortexMark';
import { ArrowIcon, MailIcon } from '@/components/icons';
import styles from './ServicesPage.module.scss';
import type { ServiceDoorProps } from './ServicesPage.types';

// One kind of service as an arched door (Figma "Three doors v2"): its
// photo, what it is in a line, and the way in. The whole door opens it;
// the button is the one stop for keyboards and assistive tech (the door's
// own link is a larger target for the pointer only). A door not open yet
// is sealed: no photo, the vortex turning slowly, and a way to hear first.
export default function ServiceDoor({ door, index }: ServiceDoorProps) {
  const { kicker, title, line, cta, photo, soon } = door;
  const internal = cta.href.startsWith('/');

  return (
    <article
      className={styles.door}
      data-soon={soon ? 'true' : undefined}
      data-motion="door"
    >
      <div className={styles.media} data-motion="door-media">
        {photo ? (
          <Frame travel={100}>
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              priority={index === 0}
              sizes="(min-width: 1024px) 34vw, (min-width: 768px) 60vw, 100vw"
              className={styles.photo}
            />
          </Frame>
        ) : (
          <span className={styles.seal} aria-hidden="true">
            <VortexMark className={styles.sealMark} />
          </span>
        )}
        <span className={styles.fade} aria-hidden="true" />
      </div>

      {internal ? (
        <Link
          className={styles.doorLink}
          href={cta.href}
          aria-hidden="true"
          tabIndex={-1}
        />
      ) : (
        <a
          className={styles.doorLink}
          href={cta.href}
          aria-hidden="true"
          tabIndex={-1}
        />
      )}

      <div className={styles.doorBody}>
        <p className={styles.kicker} data-motion="door-text">
          {kicker}
        </p>
        <h2 className={styles.doorTitle} data-motion="door-text">
          {title}
          {soon ? <span className={styles.soonDot} aria-hidden="true" /> : null}
        </h2>
        <p className={styles.doorLine} data-motion="door-text">
          {line}
        </p>
        <span className={styles.doorCta} data-motion="door-cta">
          <SigilChip
            variant="outline"
            href={cta.href}
            icon={soon ? <MailIcon /> : <ArrowIcon />}
          >
            {cta.label}
          </SigilChip>
        </span>
      </div>
    </article>
  );
}
