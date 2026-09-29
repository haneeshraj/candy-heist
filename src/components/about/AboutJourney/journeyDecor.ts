// Static geometry for the About journey, in the units of the Figma frames
// (the 1440 × 900 "About" storyboard). Derived once at module load, from
// the same seeded generators the frames were drawn with, so the server and
// the client render identical markup and the page matches the storyboard.

import { mulberry32 } from '@/lib/random/mulberry32';

export const CANVAS = { width: 1440, height: 900 } as const;

// ---- The instrument, as it sits for Who is and Nayara (frames 2 and 3).
export const ORB = { cx: 470, cy: 460 } as const;

// Frame 1 draws it centred at (720, 350), 260 across the outer ring instead
// of 290: the same drawing, moved and scaled about its centre.
export const INTRO_POSE = { x: 250, y: -110, scale: 260 / 290 } as const;

export const RINGS = [
  { id: 'outer', r: 290, stroke: 'var(--color-gold)', opacity: 0.08 },
  { id: 'second', r: 262.45, stroke: 'var(--color-gilt)', opacity: 0.16 },
  { id: 'inner', r: 203, stroke: 'var(--color-gilt)', opacity: 0.32 }
] as const;

const f1 = (n: number) => n.toFixed(1);

// A tick every 5°, the long ones every 30°, pointing in from the ring.
const TICK_RADIUS = 237.8;
export const TICKS_PATH = Array.from({ length: 72 }, (_, i) => {
  const a = (i * 5 * Math.PI) / 180;
  const length = i % 6 === 0 ? 16 : 8;
  const at = (r: number) =>
    `${f1(ORB.cx + r * Math.cos(a))} ${f1(ORB.cy + r * Math.sin(a))}`;
  return `M ${at(TICK_RADIUS)} L ${at(TICK_RADIUS - length)}`;
}).join(' ');

// The disc the photo, the logo and the planet all sit in.
export const DISC = { r: 177.625 } as const;

// The resonance lock: a crimson band on the crown of the ring, 0.8 rad
// long, its needle dropping from the label, and the point where they meet.
const LOCK_R = 201.9;
const LOCK_HALF = 0.4;
const lockAt = (a: number) =>
  `${f1(ORB.cx + LOCK_R * Math.cos(a))} ${f1(ORB.cy + LOCK_R * Math.sin(a))}`;
export const LOCK = {
  arc: `M ${lockAt(-Math.PI / 2 - LOCK_HALF)} A ${LOCK_R} ${LOCK_R} 0 0 1 ${lockAt(-Math.PI / 2 + LOCK_HALF)}`,
  width: 5.1,
  needle: { x: 470, top: 140, bottom: 257 },
  point: { cx: 470, cy: 255.55, r: 4.5 }
} as const;

// Omun: two dashed resonance rings around the planet.
export const OMUN_RINGS = [
  { r: 220, opacity: 0.22 },
  { r: 250, opacity: 0.15 }
] as const;

// ---- Nayara, in the planet's own box (0 to 355), tilted a little.
export const PLANET = { r: 177.5 } as const;

const TILT = -0.32;
const pr = PLANET.r;
const tilted = (x: number, y: number): [number, number] => [
  pr + x * Math.cos(TILT) - y * Math.sin(TILT),
  pr + x * Math.sin(TILT) + y * Math.cos(TILT)
];
const polyline = (points: Array<[number, number]>) =>
  points.map(([x, y], i) => `${i ? 'L' : 'M'} ${f1(x)} ${f1(y)}`).join(' ');
const loop = (point: (t: number) => [number, number]) =>
  polyline(Array.from({ length: 97 }, (_, i) => point((i / 96) * Math.PI * 2)));

export const PLANET_GRATICULE = [
  ...[0.3, 0.64, 0.9].map((k) =>
    loop((t) => tilted(k * pr * Math.cos(t), pr * Math.sin(t)))
  ),
  ...[-0.62, -0.3, 0, 0.3, 0.62].map((s) => {
    const y0 = s * pr;
    const w = Math.sqrt(pr * pr - y0 * y0);
    return loop((t) => tilted(w * Math.cos(t), y0 + 0.16 * w * Math.sin(t)));
  })
].join(' ');

// The fungal network: nine veins branching out from the core.
export const PLANET_VEINS: string[] = (() => {
  const random = mulberry32(31);
  const veins: string[] = [];
  const grow = (
    x: number,
    y: number,
    a: number,
    steps: number,
    depth: number
  ) => {
    const points: Array<[number, number]> = [[x, y]];
    for (let s = 0; s < steps; s++) {
      a += (random() - 0.5) * 0.7;
      x += Math.cos(a) * 11;
      y += Math.sin(a) * 11;
      if (Math.hypot(x - pr, y - pr) > pr * 0.96) break;
      points.push([x, y]);
      if (depth < 2 && random() < 0.16)
        grow(
          x,
          y,
          a + (random() < 0.5 ? 0.9 : -0.9),
          Math.floor(steps * 0.55),
          depth + 1
        );
    }
    if (points.length > 1) veins.push(polyline(points));
  };
  for (let i = 0; i < 9; i++)
    grow(pr, pr, (i / 9) * Math.PI * 2 + random() * 0.4, 16, 0);
  return veins;
})();

// ---- Behind the signal: the 3:4 frame the orb squares into.
export const FRAME = { x: 876, y: 150, width: 420, height: 560 } as const;

// A tick every 12 along the top, a long one every 60.
export const FRAME_TICKS_PATH = Array.from({ length: 36 }, (_, i) => {
  const x = FRAME.x + i * 12;
  return `M ${x} 132 L ${x} ${i % 5 === 0 ? 120 : 126}`;
}).join(' ');

// Corner brackets, 22 long, 10 outside the frame.
export const FRAME_BRACKETS = (() => {
  const { x, y, width: w, height: h } = FRAME;
  const corners: Array<[number, number, 1 | -1, 1 | -1]> = [
    [x - 10, y - 10, 1, 1],
    [x + w + 10, y - 10, -1, 1],
    [x - 10, y + h + 10, 1, -1],
    [x + w + 10, y + h + 10, -1, -1]
  ];
  return corners
    .map(
      ([cx, cy, sx, sy]) =>
        `M ${cx + sx * 22} ${cy} L ${cx} ${cy} L ${cx} ${cy + sy * 22}`
    )
    .join(' ');
})();

export const FRAME_LOCK = {
  needle: { x: 1086, top: 90, bottom: 150 },
  point: { cx: 1086, cy: 150, r: 4.5 }
} as const;
