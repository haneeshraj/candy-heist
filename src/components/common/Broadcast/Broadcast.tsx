import styles from './Broadcast.module.scss';
import type { BroadcastProps } from './Broadcast.types';

// Figma "Broadcast": nine rings rise from a crimson source on a horizon,
// alternating solid and dotted, over faint bearing lines, with pulses that
// motion can send out through them. Drawn in 2000 units around the source
// at (0, 0), so each place just sets how big the drawing is and where its
// horizon sits (see Broadcast.module.scss). The motion hooks find the parts
// by their data-motion names.

const RINGS = [70, 130, 200, 280, 370, 470, 580, 700, 830];
const PULSE = 300;
const BEARINGS = Array.from({ length: 17 }, (_, i) => 190 + i * 10);

const round = (n: number) => Math.round(n * 100) / 100;

function bearing(degrees: number) {
  const a = (degrees * Math.PI) / 180;
  return {
    x1: round(44 * Math.cos(a)),
    y1: round(44 * Math.sin(a)),
    x2: round(980 * Math.cos(a)),
    y2: round(980 * Math.sin(a))
  };
}

export default function Broadcast({ className, pulses = 0 }: BroadcastProps) {
  return (
    <div
      className={
        className ? `${styles.broadcast} ${className}` : styles.broadcast
      }
      aria-hidden="true"
    >
      <svg className={styles.sky} viewBox="-1000 -1000 2000 1000">
        <g className={styles.bearings} data-motion="bearings">
          {BEARINGS.map((degrees) => (
            <line key={degrees} {...bearing(degrees)} />
          ))}
        </g>
        {RINGS.map((r, i) => (
          <circle
            key={r}
            r={r}
            className={i % 3 === 1 ? styles.ringDotted : styles.ring}
            style={{ strokeOpacity: Math.max(0.08, 0.62 - i * 0.065) }}
            data-motion="ring"
          />
        ))}
        {Array.from({ length: pulses }, (_, i) => (
          <circle
            key={i}
            r={PULSE}
            className={styles.pulse}
            data-motion="pulse"
          />
        ))}
      </svg>

      <span className={styles.scrim} />
      <span
        className={`${styles.horizon} ${styles.horizonLeft}`}
        data-motion="horizon"
      />
      <span
        className={`${styles.horizon} ${styles.horizonRight}`}
        data-motion="horizon"
      />
      <span className={styles.sourceHalo} data-motion="source-halo" />
      <span className={styles.source} data-motion="source" />
    </div>
  );
}
