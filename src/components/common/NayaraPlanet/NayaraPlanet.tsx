'use client';

import { useEffect, useRef, useState } from 'react';
import { PLANET_SIZE, type PlanetSpec } from '@/lib/planets/engine';
import { PlanetGraphic } from '@/lib/planets/react';
import styles from './NayaraPlanet.module.scss';

export interface NayaraPlanetLayer {
  /** The planet's look: a preset, or one made in Candy Haven. */
  planet: PlanetSpec;
  /** A Blender render to show in the planet, once there is one. */
  render?: { src: string };
}

interface NayaraPlanetProps {
  /** One layer per look; all are drawn, and `active` is the one shown. */
  layers: NayaraPlanetLayer[];
  active?: number;
  className?: string;
}

// Nayara, drawn flat (no glow), in the look of a lore chapter: one of the
// 11 the lore was designed with, or one made in Candy Haven's LORE editor.
// Every look is drawn at once and all but one hidden, so motion can
// crossfade from chapter to chapter (`[data-planet-look]`).
//
// Looks with moving layers move only while they're shown and on screen:
// the hidden ones and the whole planet, scrolled away, carry
// `data-paused`, which stops their layers where they are.
export default function NayaraPlanet({
  layers,
  active = 0,
  className
}: NayaraPlanetProps) {
  const ref = useRef<SVGSVGElement | null>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const svg = ref.current;
    if (!svg || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) =>
      setInView(entry.isIntersecting)
    );
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  return (
    <svg
      ref={ref}
      className={className ? `${styles.planet} ${className}` : styles.planet}
      viewBox={`0 0 ${PLANET_SIZE} ${PLANET_SIZE}`}
      aria-hidden="true"
      focusable="false"
      data-paused={inView ? undefined : ''}
    >
      {layers.map((layer, i) => (
        <g
          key={i}
          data-planet-look={i}
          opacity={i === active ? 1 : 0}
          data-paused={i === active ? undefined : ''}
        >
          <PlanetGraphic spec={layer.planet} render={layer.render} />
        </g>
      ))}
    </svg>
  );
}
