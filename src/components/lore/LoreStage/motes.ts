import { mulberry32 } from '@/lib/random/mulberry32';

// The dust round the orrery: three rings of motes, in the orbit's own
// units (its radius is 300), each turning at its own steady rate. The
// inner ring runs between the planet and the orbit, the outer two just
// beyond it, the middle one the other way round. Seeded, so the server
// and the browser draw the same dust.

export interface Mote {
  cx: string;
  cy: string;
  r: string;
  opacity: string;
}

export interface MoteRing {
  motes: Mote[];
  /** Seconds a whole turn takes. */
  period: number;
  reverse: boolean;
}

const RINGS = [
  { count: 8, from: 0.8, to: 0.94, period: 80, reverse: false },
  { count: 9, from: 1.06, to: 1.2, period: 150, reverse: true },
  { count: 7, from: 1.24, to: 1.42, period: 240, reverse: false }
];

export const MOTE_RINGS: MoteRing[] = (() => {
  const random = mulberry32(41);
  return RINGS.map(({ count, from, to, period, reverse }) => ({
    period,
    reverse,
    motes: Array.from({ length: count }, () => {
      const angle = random() * Math.PI * 2;
      const radius = 300 * (from + random() * (to - from));
      // One in six is a brighter grain.
      const bright = random() < 1 / 6;
      return {
        cx: (radius * Math.cos(angle)).toFixed(1),
        cy: (radius * Math.sin(angle)).toFixed(1),
        r: (bright ? 2 + random() * 0.6 : 0.9 + random() * 0.9).toFixed(2),
        opacity: (bright ? 0.55 : 0.18 + random() * 0.3).toFixed(2)
      };
    })
  }));
})();
