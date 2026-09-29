import Image from 'next/image';
import { VortexMark } from '@/components/common/VortexMark';
import type { AboutPhoto } from '@/content/about/about';
import Planet from './Planet';
import { photoFocus } from './photoFocus';
import { LOCK, OMUN_RINGS, ORB, RINGS, TICKS_PATH } from './journeyDecor';
import styles from './AboutJourney.module.scss';

type OrbFigureProps =
  { mode: 'logo' } | { mode: 'photo'; photo: AboutPhoto } | { mode: 'planet' };

// The orb as a still, for phones and reduced motion, where each screen
// stacks instead of the one orb travelling: the same drawing cropped to a
// square around it, with the logo, his photo (and the lock) or Nayara.
export default function OrbFigure(props: OrbFigureProps) {
  return (
    <div className={styles.figure} data-motion="figure">
      <svg
        className={styles.figureDrawing}
        viewBox="165 155 610 610"
        aria-hidden="true"
        focusable="false"
      >
        {RINGS.map((ring) => (
          <circle
            key={ring.id}
            cx={ORB.cx}
            cy={ORB.cy}
            r={ring.r}
            stroke={ring.stroke}
            strokeOpacity={ring.opacity}
          />
        ))}
        <path className={styles.ticks} d={TICKS_PATH} />
        {props.mode === 'planet' &&
          OMUN_RINGS.map((ring) => (
            <circle
              key={ring.r}
              className={styles.omun}
              cx={ORB.cx}
              cy={ORB.cy}
              r={ring.r}
              strokeOpacity={ring.opacity}
            />
          ))}
        {props.mode === 'photo' && (
          <>
            <path
              className={`${styles.lockArc} ${styles.figureLockArc}`}
              d={LOCK.arc}
              strokeWidth={LOCK.width}
            />
            <circle
              className={styles.lockPoint}
              cx={LOCK.point.cx}
              cy={LOCK.point.cy}
              r={LOCK.point.r}
            />
          </>
        )}
      </svg>

      {props.mode === 'planet' ? (
        <Planet className={styles.figurePlanet} />
      ) : (
        <span className={styles.figureDisc}>
          {props.mode === 'logo' ? (
            <span className={styles.figureLogo} aria-hidden="true">
              <VortexMark />
            </span>
          ) : (
            <Image
              src={props.photo.src}
              alt={props.photo.alt}
              fill
              sizes="(min-width: 1024px) 360px, 70vw"
              className={styles.windowImage}
              style={photoFocus(props.photo)}
            />
          )}
        </span>
      )}
    </div>
  );
}
