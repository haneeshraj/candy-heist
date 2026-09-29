import { useId } from 'react';
import { PLANET, PLANET_GRATICULE, PLANET_VEINS } from './journeyDecor';
import styles from './AboutJourney.module.scss';

// Nayara, drawn flat (no glow): a tilted graticule, the fungal network
// branching out from the core, a night side, and the crimson core, Omun's
// source. Each vein has a path length of 1, so motion can draw it out.
export default function Planet({ className }: { className?: string }) {
  const shadeId = useId();
  const clipId = useId();
  const d = PLANET.r * 2;

  return (
    <svg
      className={className ? `${styles.planet} ${className}` : styles.planet}
      viewBox={`0 0 ${d} ${d}`}
      aria-hidden="true"
      focusable="false"
      data-motion="planet"
    >
      <defs>
        <linearGradient id={shadeId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0.35" stopColor="#0c0c0c" stopOpacity="0" />
          <stop offset="1" stopColor="#0c0c0c" stopOpacity="0.62" />
        </linearGradient>
        <clipPath id={clipId}>
          <circle cx={PLANET.r} cy={PLANET.r} r={PLANET.r} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <circle
          className={styles.planetSurface}
          cx={PLANET.r}
          cy={PLANET.r}
          r={PLANET.r}
        />
        <path className={styles.planetGraticule} d={PLANET_GRATICULE} />
        {PLANET_VEINS.map((vein, i) => (
          <path
            key={i}
            className={styles.planetVein}
            d={vein}
            pathLength={1}
            data-motion="vein"
          />
        ))}
        <rect width={d} height={d} fill={`url(#${shadeId})`} />
      </g>
      <circle className={styles.planetCore} cx={PLANET.r} cy={PLANET.r} r={5} />
      <circle
        className={styles.planetEdge}
        cx={PLANET.r}
        cy={PLANET.r}
        r={PLANET.r - 0.5}
      />
    </svg>
  );
}
