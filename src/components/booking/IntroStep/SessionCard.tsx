import Image from 'next/image';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { ScrambleText } from '@/components/common/ScrambleText';
import { WordReveal } from '@/components/common/WordReveal';
import styles from './IntroStep.module.scss';
import type { SessionCardProps } from './IntroStep.types';

const CAPITALS = { range: [65, 90] as [number, number] };

// One session as a photo card (Figma "Booking / Session card"). It's a real
// radio input under the photo, so the four cards arrow-key like a group.
// The text decodes in as the card scrolls into view.
export default function SessionCard({
  service,
  name,
  selected,
  onSelect
}: SessionCardProps) {
  return (
    <label
      className={styles.card}
      data-selected={selected ? 'true' : undefined}
      data-reveal
    >
      <input
        type="radio"
        name={name}
        value={service.id}
        checked={selected}
        onChange={() => onSelect(service.id)}
        className={styles.srOnly}
      />
      <span className={styles.cardPhoto}>
        <Image
          src={service.photos.portrait}
          alt=""
          fill
          sizes="(min-width: 1024px) 294px, (min-width: 768px) 46vw, 100vw"
          className={styles.cardImage}
        />
      </span>
      <span className={styles.cardFade} aria-hidden="true" />
      <span className={styles.cardRule} aria-hidden="true" />
      <span className={styles.radio} aria-hidden="true">
        <span className={styles.radioDot} />
      </span>
      <span className={styles.cardText}>
        <span className={styles.srOnly}>
          {service.name}. {service.meta}. {service.tagline}
        </span>
        <span aria-hidden="true" className={styles.cardMeta}>
          <ClipRevealText
            text={service.meta}
            trigger="inView"
            wipeColor="var(--color-gilt)"
            staggerDelay={0.02}
          />
        </span>
        <span aria-hidden="true" className={styles.cardName}>
          <ScrambleText
            text={service.name}
            trigger="inView"
            startDelay={0.2}
            staggerDelay={0.03}
            letterDuration={0.7}
            scramble={CAPITALS}
          />
        </span>
        <span aria-hidden="true" className={styles.cardTagline}>
          <WordReveal
            text={service.tagline}
            trigger="inView"
            startDelay={0.4}
          />
        </span>
      </span>
    </label>
  );
}
