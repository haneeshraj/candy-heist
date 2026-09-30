import { mulberry32 } from '@/lib/random/mulberry32';

// Nayara as the storyboards draw it, in the planet's own 355 × 355 box:
// a tilted graticule, the fungal network branching out from the core, and
// the overlays each lore chapter adds. Seeded, from the same generators
// the Figma frames used, so server and client render identical markup and
// the planet matches the designs.

export const PLANET_R = 177.5;
const r = PLANET_R;
const f1 = (n: number) => n.toFixed(1);

const TILT = -0.32;
const tilted = (x: number, y: number): [number, number] => [
  r + x * Math.cos(TILT) - y * Math.sin(TILT),
  r + x * Math.sin(TILT) + y * Math.cos(TILT)
];
const polyline = (points: Array<[number, number]>, close = false) =>
  points.map(([x, y], i) => `${i ? 'L' : 'M'} ${f1(x)} ${f1(y)}`).join(' ') +
  (close ? ' Z' : '');
const loop = (point: (t: number) => [number, number]) =>
  polyline(Array.from({ length: 97 }, (_, i) => point((i / 96) * Math.PI * 2)));

function graticule(meridians: number[], parallels: number[]) {
  return [
    ...meridians.map((k) =>
      loop((t) => tilted(k * r * Math.cos(t), r * Math.sin(t)))
    ),
    ...parallels.map((s) => {
      const y0 = s * r;
      const w = Math.sqrt(r * r - y0 * y0);
      return loop((t) => tilted(w * Math.cos(t), y0 + 0.16 * w * Math.sin(t)));
    })
  ].join(' ');
}

export const GRATICULE = graticule(
  [0.3, 0.64, 0.9],
  [-0.62, -0.3, 0, 0.3, 0.62]
);

// Modern society's tighter grid.
export const GRATICULE_DENSE = graticule(
  [0.15, 0.3, 0.45, 0.6, 0.75, 0.9],
  [-0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8]
);

// The fungal network: nine veins out from the core, branching now and then.
export const VEINS: string[] = (() => {
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
      if (Math.hypot(x - r, y - r) > r * 0.96) break;
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
    grow(r, r, (i / 9) * Math.PI * 2 + random() * 0.4, 16, 0);
  return veins;
})();

export interface Dot {
  x: number;
  y: number;
  r: number;
}
export interface Bar {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ---- The chapter overlays. Each draws from its own fresh seed.
const overlay = () => mulberry32(77);

// Nayarasam: one line through nine beings around the core.
export const UNITY = (() => {
  const points = Array.from({ length: 9 }, (_, i): [number, number] => {
    const a = (i / 9) * Math.PI * 2;
    return [r + r * 0.62 * Math.cos(a), r + r * 0.62 * Math.sin(a)];
  });
  return {
    line: polyline(points, true),
    beings: points.map(([x, y]) => ({ x: +f1(x), y: +f1(y), r: r * 0.025 }))
  };
})();

// Sentient life: many lineages, the near ones linked.
export const KIN = (() => {
  const random = overlay();
  const points = Array.from({ length: 46 }, (): [number, number] => {
    const a = random() * Math.PI * 2;
    const d = Math.sqrt(random()) * r * 0.9;
    return [r + d * Math.cos(a), r + d * Math.sin(a)];
  });
  const links: string[] = [];
  points.forEach((p, i) =>
    points.slice(i + 1).forEach((q) => {
      if (Math.hypot(p[0] - q[0], p[1] - q[1]) < r * 0.24)
        links.push(`M ${f1(p[0])} ${f1(p[1])} L ${f1(q[0])} ${f1(q[1])}`);
    })
  );
  return {
    links: links.join(' '),
    lineages: points.map(([x, y], i) => ({
      x: +f1(x),
      y: +f1(y),
      r: r * (i % 4 ? 0.015 : 0.025)
    }))
  };
})();

// The Great Disconnection: the signal breaking up across the lower half.
export const INTERFERENCE: Array<Bar & { gilt: boolean }> = (() => {
  const random = overlay();
  return Array.from({ length: 34 }, () => {
    const x = random() * 2 * r;
    const y = r * 0.5 + random() * r;
    const w = r * (0.1 + random() * 0.35);
    const h = 1 + random() * 2.5;
    return {
      x: +f1(x),
      y: +f1(y),
      w: +f1(w),
      h: +f1(h),
      gilt: random() >= 0.6
    };
  });
})();

// Sonoalchemy: its four-pointed star etched over the planet.
export const SIGIL = (() => {
  const s = r * 0.62;
  const k = r * 0.2;
  return {
    star: polyline(
      [
        [r, r - s],
        [r + k, r - k],
        [r + s, r],
        [r + k, r + k],
        [r, r + s],
        [r - k, r + k],
        [r - s, r],
        [r - k, r - k]
      ],
      true
    ),
    ring: s * 0.75,
    eye: k * 0.45
  };
})();

// The Great Suppression: half of it struck out.
export const REDACTIONS: Bar[] = (() => {
  const random = overlay();
  return Array.from({ length: 7 }, (_, i) => ({
    x: +f1(r * (0.1 + random() * 0.2)),
    y: +f1(r + i * r * 0.13),
    w: +f1(r * (1.2 + random() * 0.5)),
    h: +f1(r * 0.07)
  }));
})();

// Memory manipulation: a part of it gone.
export const ABSENCE: Dot = { x: r * 1.25, y: r * 0.85, r: r * 0.45 };

// Candy: crimson fragments scattered through it.
export const FRAGMENTS: Dot[] = (() => {
  const random = overlay();
  return Array.from({ length: 26 }, () => {
    const a = random() * Math.PI * 2;
    const d = Math.sqrt(random()) * r * 0.88;
    return {
      x: +f1(r + d * Math.cos(a)),
      y: +f1(r + d * Math.sin(a)),
      r: +f1(r * (0.01 + random() * 0.015))
    };
  });
})();
