import styles from './Rings.module.scss';
import type { RingsProps } from './Rings.types';

// Concentric gilt rings crossed by faint spokes (Figma "Deco / Rings"): the
// quiet field behind the player's play button and the confirmation. Every
// third ring is a touch brighter. Turns slowly when motion is allowed.

const RING_COUNT = 10;
const SPOKE_COUNT = 24;
// Rounded so the server and client render identical attribute strings.
const at = (value: number) => Math.round(value * 1000) / 1000;

export default function Rings({ className, spin = true }: RingsProps) {
  return (
    <svg
      className={className ? `${styles.rings} ${className}` : styles.rings}
      viewBox="-100 -100 200 200"
      data-spin={spin ? 'true' : undefined}
      data-motion="rings"
      aria-hidden="true"
      focusable="false"
    >
      {Array.from({ length: RING_COUNT }, (_, i) => (
        <circle
          key={`ring-${i}`}
          r={((i + 1) / RING_COUNT) * 100}
          strokeOpacity={(i + 1) % 3 === 0 ? 0.09 : 0.05}
        />
      ))}
      {Array.from({ length: SPOKE_COUNT }, (_, i) => {
        const angle = (i / SPOKE_COUNT) * Math.PI * 2;
        const inner = 10;
        return (
          <line
            key={`spoke-${i}`}
            x1={at(Math.cos(angle) * inner)}
            y1={at(Math.sin(angle) * inner)}
            x2={at(Math.cos(angle) * 100)}
            y2={at(Math.sin(angle) * 100)}
            strokeOpacity={i % 6 === 0 ? 0.06 : 0.03}
          />
        );
      })}
    </svg>
  );
}
