import { FRAME_BRACKETS, FRAME_LOCK, FRAME_TICKS_PATH } from './journeyDecor';
import styles from './AboutJourney.module.scss';

// What the orb keeps once it has squared into the 3:4 frame (desktop
// only): the corner brackets, a tick scale along the top, and the lock
// needle and point on its crown.
export default function FrameChrome() {
  return (
    <svg
      className={styles.chrome}
      viewBox="0 0 1440 900"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className={styles.frameTicks}
        d={FRAME_TICKS_PATH}
        data-motion="frame-ticks"
      />
      <path
        className={styles.frameBrackets}
        d={FRAME_BRACKETS}
        data-motion="frame-brackets"
      />
      <line
        className={styles.frameNeedle}
        x1={FRAME_LOCK.needle.x}
        x2={FRAME_LOCK.needle.x}
        y1={FRAME_LOCK.needle.top}
        y2={FRAME_LOCK.needle.bottom}
        data-motion="frame-needle"
      />
      <circle
        className={styles.framePoint}
        cx={FRAME_LOCK.point.cx}
        cy={FRAME_LOCK.point.cy}
        r={FRAME_LOCK.point.r}
        data-motion="frame-point"
      />
    </svg>
  );
}
