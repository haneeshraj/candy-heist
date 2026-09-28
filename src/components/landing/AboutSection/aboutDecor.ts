// Static geometry for the About section's decoration, all derived once at
// module load so server and client render identical markup.

// ---- Arch ribs, in the arch's own 460 × 640 box (apex at 230, 0).
const ARCH_WIDTH = 460;
const ARCH_HEIGHT = 640;
const ARCH_RADIUS = ARCH_WIDTH / 2;
const KAPPA = 0.5523; // cubic-bezier approximation of a quarter circle

export const ARCH_VIEWBOX = `0 0 ${ARCH_WIDTH} ${ARCH_HEIGHT}`;

// Two concentric outlines 16 and 32 units outside the photo, each drawn as
// a left and right half that start at the apex so they can "draw down"
// from the keystone.
export const RIBS = [
  { id: 'outer', radius: ARCH_RADIUS + 32, opacity: 0.14 },
  { id: 'inner', radius: ARCH_RADIUS + 16, opacity: 0.26 }
].map((rib) => ({
  ...rib,
  halves: ([-1, 1] as const).map((side) => {
    const top = ARCH_RADIUS - rib.radius;
    const x = ARCH_RADIUS + side * rib.radius;
    const k = KAPPA * rib.radius;
    return `M ${ARCH_RADIUS} ${top} C ${ARCH_RADIUS + side * k} ${top} ${x} ${ARCH_RADIUS - k} ${x} ${ARCH_RADIUS} L ${x} ${ARCH_HEIGHT}`;
  })
}));

// ---- Rose field behind the orb, in an 1800 × 1800 box centred on it.
export const ROSE_SIZE = 1800;
const ROSE_CENTER = ROSE_SIZE / 2;

export const RINGS = [
  { radius: 180, opacity: 0.07, dashed: false },
  { radius: 300, opacity: 0.06, dashed: true },
  { radius: 440, opacity: 0.05, dashed: false },
  { radius: 600, opacity: 0.045, dashed: true },
  { radius: 780, opacity: 0.04, dashed: false }
];

const SPOKE_COUNT = 32;
export const SPOKES_PATH = Array.from({ length: SPOKE_COUNT }, (_, i) => {
  const angle = (i / SPOKE_COUNT) * Math.PI * 2;
  const point = (r: number) =>
    `${(ROSE_CENTER + r * Math.cos(angle)).toFixed(1)} ${(ROSE_CENTER + r * Math.sin(angle)).toFixed(1)}`;
  return `M ${point(150)} L ${point(ROSE_CENTER)}`;
}).join(' ');

// ---- Dust motes, three parallax layers. Seeded so positions are stable.
export interface Mote {
  x: number; // % of section width
  y: number; // % of layer height (each layer overhangs the section by 30%)
  size: number; // px
  opacity: number;
}

function seeded(seed: number) {
  let state = seed;
  return () => (state = (state * 16807) % 2147483647) / 2147483647;
}

function motes(
  count: number,
  [minSize, maxSize]: [number, number],
  [minOpacity, maxOpacity]: [number, number],
  seed: number
): Mote[] {
  const random = seeded(seed);
  return Array.from({ length: count }, () => ({
    x: +(random() * 100).toFixed(2),
    y: +(random() * 100).toFixed(2),
    size: +(minSize + random() * (maxSize - minSize)).toFixed(2),
    opacity: +(minOpacity + random() * (maxOpacity - minOpacity)).toFixed(3)
  }));
}

export const DUST_LAYERS = [
  { depth: 'far', motes: motes(22, [1.2, 2.2], [0.12, 0.24], 17) },
  { depth: 'mid', motes: motes(16, [2, 3.2], [0.2, 0.34], 29) },
  { depth: 'near', motes: motes(10, [3.2, 4.8], [0.26, 0.44], 43) }
] as const;
