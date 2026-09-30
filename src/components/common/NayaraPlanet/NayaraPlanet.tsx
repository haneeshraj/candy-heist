import { useId } from 'react';
import type { PlanetState } from '@/content/lore/lore';
import styles from './NayaraPlanet.module.scss';
import {
  ABSENCE,
  FRAGMENTS,
  GRATICULE,
  GRATICULE_DENSE,
  INTERFERENCE,
  KIN,
  PLANET_R,
  REDACTIONS,
  SIGIL,
  UNITY,
  VEINS
} from './planetGeometry';

export interface NayaraPlanetLayer {
  state: PlanetState;
  /** A Blender render to show in the planet, once there is one. */
  render?: { src: string };
}

interface NayaraPlanetProps {
  /** One layer per look; all are drawn, and `active` is the one shown. */
  layers: NayaraPlanetLayer[];
  active?: number;
  className?: string;
}

// How the fungal network reads in each look.
const VEIN_OPACITY: Record<PlanetState, number> = {
  network: 0.9,
  omun: 0.5,
  unity: 0.55,
  many: 0.3,
  disconnect: 0.4,
  sigil: 0.25,
  suppress: 0.42,
  order: 0,
  forget: 0.22,
  candy: 0.4,
  heist: 0.45
};
const CRIMSON_CORE: PlanetState[] = ['omun', 'heist'];

const r = PLANET_R;
const d = r * 2;

function Look({ state, render }: NayaraPlanetLayer) {
  const dashed = state === 'disconnect' || state === 'forget';
  return (
    <>
      {render && (
        <image
          href={render.src}
          width={d}
          height={d}
          preserveAspectRatio="xMidYMid slice"
        />
      )}
      <path
        className={styles.graticule}
        d={state === 'order' ? GRATICULE_DENSE : GRATICULE}
        strokeOpacity={state === 'order' ? 0.3 : 0.16}
      />
      {VEIN_OPACITY[state] > 0 && (
        <g
          className={styles.veins}
          strokeOpacity={VEIN_OPACITY[state]}
          strokeWidth={state === 'network' ? 1.3 : 0.9}
          strokeDasharray={dashed ? '4 5' : undefined}
        >
          {VEINS.map((vein, i) => (
            <path key={i} d={vein} />
          ))}
        </g>
      )}

      {state === 'unity' && (
        <g className={styles.gilt}>
          <path className={styles.line} d={UNITY.line} />
          {UNITY.beings.map((dot, i) => (
            <circle key={i} cx={dot.x} cy={dot.y} r={dot.r} />
          ))}
        </g>
      )}
      {state === 'many' && (
        <g className={styles.gilt}>
          <path className={styles.kinship} d={KIN.links} />
          {KIN.lineages.map((dot, i) => (
            <circle key={i} cx={dot.x} cy={dot.y} r={dot.r} />
          ))}
        </g>
      )}
      {state === 'disconnect' &&
        INTERFERENCE.map((bar, i) => (
          <rect
            key={i}
            className={bar.gilt ? styles.noiseGilt : styles.noise}
            x={bar.x}
            y={bar.y}
            width={bar.w}
            height={bar.h}
          />
        ))}
      {state === 'sigil' && (
        <g className={styles.sigil}>
          <path d={SIGIL.star} />
          <circle cx={r} cy={r} r={SIGIL.ring} strokeOpacity={0.6} />
          <circle cx={r} cy={r} r={SIGIL.eye} />
        </g>
      )}
      {state === 'suppress' &&
        REDACTIONS.map((bar, i) => (
          <rect
            key={i}
            className={styles.redaction}
            x={bar.x}
            y={bar.y}
            width={bar.w}
            height={bar.h}
          />
        ))}
      {state === 'forget' && (
        <>
          <circle
            className={styles.absence}
            cx={ABSENCE.x}
            cy={ABSENCE.y}
            r={ABSENCE.r}
          />
          <circle
            className={styles.absenceEdge}
            cx={ABSENCE.x}
            cy={ABSENCE.y}
            r={ABSENCE.r}
          />
        </>
      )}
      {state === 'candy' &&
        FRAGMENTS.map((dot, i) => (
          <circle
            key={i}
            className={styles.fragment}
            cx={dot.x}
            cy={dot.y}
            r={dot.r}
          />
        ))}
    </>
  );
}

// Nayara, drawn flat (no glow), in any of the looks the lore chapters
// give it: the network lit, Omun's crimson core, one line through all,
// the lineages, the signal breaking up, the sigil etched, half struck out,
// the grid tightened, a part gone missing, crimson fragments, the lock's
// return. Every look is drawn at once and all but one hidden, so motion
// can crossfade from chapter to chapter.
export default function NayaraPlanet({
  layers,
  active = 0,
  className
}: NayaraPlanetProps) {
  const shadeId = useId();
  const clipId = useId();

  return (
    <svg
      className={className ? `${styles.planet} ${className}` : styles.planet}
      viewBox={`0 0 ${d} ${d}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={shadeId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0.35" stopColor="#0c0c0c" stopOpacity="0" />
          <stop offset="1" stopColor="#0c0c0c" stopOpacity="0.62" />
        </linearGradient>
        <clipPath id={clipId}>
          <circle cx={r} cy={r} r={r} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <circle className={styles.surface} cx={r} cy={r} r={r} />
        {layers.map((layer, i) => (
          <g
            key={i}
            className={styles.look}
            data-planet-look={i}
            opacity={i === active ? 1 : 0}
          >
            <Look {...layer} />
          </g>
        ))}
        <rect width={d} height={d} fill={`url(#${shadeId})`} />
      </g>

      {layers.map((layer, i) => (
        <g key={i} data-planet-core={i} opacity={i === active ? 1 : 0}>
          <circle
            className={
              CRIMSON_CORE.includes(layer.state)
                ? styles.coreCrimson
                : styles.core
            }
            cx={r}
            cy={r}
            r={CRIMSON_CORE.includes(layer.state) ? r * 0.04 : r * 0.025}
          />
          {layer.state === 'heist' && (
            <circle className={styles.coreRing} cx={r} cy={r} r={r * 0.11} />
          )}
        </g>
      ))}
      <circle className={styles.edge} cx={r} cy={r} r={r - 0.5} />
    </svg>
  );
}
