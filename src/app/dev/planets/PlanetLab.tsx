'use client';

import {
  LAYER_GROUPS,
  LAYER_TYPES,
  LAYER_TYPE_IDS,
  PRESETS,
  planetSpecSchema,
  type PlanetSpec,
  type PlanetSpecInput
} from '@/lib/planets/engine';
import { PlanetSvg } from '@/lib/planets/react';
import styles from './PlanetLab.module.scss';

const planet = (input: PlanetSpecInput): PlanetSpec =>
  planetSpecSchema.parse(input);

const alone = (type: (typeof LAYER_TYPE_IDS)[number]) =>
  planet({
    layers: [
      { id: 'backdrop', type: 'grid', opacity: 0.08 },
      { id: `sample-${type}`, type, seed: 7 }
    ]
  });

// Planets built from many layers, with motion, to see them together.
const SHOWCASE: Array<{ name: string; spec: PlanetSpec }> = [
  {
    name: 'Ringed giant',
    spec: planet({
      surface: {
        kind: 'gradient',
        color: '#1d1915',
        color2: '#0c0c0c',
        angle: 120
      },
      layers: [
        { id: 'bands', type: 'bands', seed: 4 },
        { id: 'grid', type: 'grid', opacity: 0.1 },
        { id: 'ring', type: 'ring', seed: 2, rotation: -14 },
        {
          id: 'moons',
          type: 'moons',
          seed: 9,
          motion: { kind: 'spin', seconds: 60 }
        },
        { id: 'core', type: 'core' }
      ]
    })
  },
  {
    name: 'Hive',
    spec: planet({
      layers: [
        { id: 'mesh', type: 'mesh', seed: 1 },
        { id: 'craters', type: 'craters', seed: 3 },
        {
          id: 'dial',
          type: 'dial',
          motion: { kind: 'spin', seconds: 90, reverse: true }
        },
        {
          id: 'core',
          type: 'core',
          color: '#c4453a',
          params: { size: 0.04, ring: true }
        }
      ]
    })
  },
  {
    name: 'Vortex',
    spec: planet({
      layers: [
        {
          id: 'spiral',
          type: 'spiral',
          seed: 1,
          motion: { kind: 'spin', seconds: 40 }
        },
        {
          id: 'emblem',
          type: 'emblem',
          opacity: 0.35,
          motion: { kind: 'pulse', seconds: 6 }
        },
        { id: 'waves', type: 'waves', motion: { kind: 'pulse', seconds: 4 } },
        { id: 'core', type: 'core', params: { shape: 'double' } }
      ]
    })
  },
  {
    name: 'Broken signal',
    spec: planet({
      layers: [
        { id: 'grid', type: 'grid' },
        { id: 'scan', type: 'scanlines', opacity: 0.08 },
        {
          id: 'noise',
          type: 'noise',
          seed: 77,
          motion: { kind: 'flicker', seconds: 3 }
        },
        {
          id: 'glitch',
          type: 'glitch',
          seed: 5,
          motion: { kind: 'drift', seconds: 5 }
        },
        { id: 'cracks', type: 'cracks', seed: 2 },
        { id: 'core', type: 'core' }
      ]
    })
  },
  {
    name: 'Circuit moon',
    spec: planet({
      surface: {
        kind: 'grain',
        color: '#141213',
        color2: '#8a8071',
        grain: 0.25
      },
      layers: [
        { id: 'halftone', type: 'halftone' },
        { id: 'circuits', type: 'circuits', seed: 6 },
        {
          id: 'orbits',
          type: 'orbits',
          seed: 4,
          rotation: 20,
          motion: { kind: 'spin', seconds: 120 }
        },
        { id: 'core', type: 'core', params: { shape: 'diamond', size: 0.035 } }
      ]
    })
  },
  {
    name: 'Contour world',
    spec: planet({
      rim: { double: true, dash: 'dashed' },
      layers: [
        { id: 'contours', type: 'contours', seed: 8 },
        {
          id: 'veins',
          type: 'veins',
          seed: 31,
          opacity: 0.5,
          params: { curl: 0.12, taper: 0.7 }
        },
        { id: 'constellation', type: 'constellation', seed: 2, opacity: 0.7 },
        {
          id: 'missing',
          type: 'missing',
          params: { shape: 'wedge', angle: 70, cx: 0, cy: 0, size: 0.9 }
        },
        { id: 'core', type: 'core' }
      ]
    })
  }
];

export default function PlanetLab() {
  return (
    <main className={styles.lab}>
      <h1 className={styles.title}>Planet lab</h1>

      <h2 className={styles.heading}>Presets</h2>
      <ul className={styles.grid}>
        {PRESETS.map((preset) => (
          <li key={preset.id} className={styles.card} data-planet={preset.id}>
            <PlanetSvg className={styles.planet} spec={preset.spec} />
            <span className={styles.name}>{preset.name}</span>
          </li>
        ))}
      </ul>

      <h2 className={styles.heading}>Built from many</h2>
      <ul className={styles.grid}>
        {SHOWCASE.map(({ name, spec }) => (
          <li key={name} className={styles.card}>
            <PlanetSvg className={styles.planet} spec={spec} />
            <span className={styles.name}>{name}</span>
          </li>
        ))}
      </ul>

      {LAYER_GROUPS.map((group) => (
        <section key={group.id}>
          <h2 className={styles.heading}>{group.label}</h2>
          <ul className={styles.grid}>
            {LAYER_TYPE_IDS.filter(
              (type) => LAYER_TYPES[type].group === group.id
            ).map((type) => (
              <li key={type} className={styles.card} data-layer-type={type}>
                <PlanetSvg className={styles.planet} spec={alone(type)} still />
                <span className={styles.name}>{LAYER_TYPES[type].label}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
