import { mulberry32 } from '@/lib/random/mulberry32';

// Forty stars at least 90 apart over the 1440 × 900 frame, about half the
// pairs under 150 apart joined: the generator the Figma frames used, so the
// field matches the storyboard.

export interface Star {
  x: number;
  y: number;
  r: number;
  opacity: number;
  /** For the stars that twinkle (every fourth): its cycle, in seconds. */
  twinkle?: { duration: string; delay: string };
}

const f1 = (n: number) => n.toFixed(1);

export const STARS: { stars: Star[]; links: string } = (() => {
  const random = mulberry32(12);
  const points: Array<[number, number]> = [];
  while (points.length < 40) {
    const p: [number, number] = [random() * 1440, random() * 900];
    if (points.every(([qx, qy]) => Math.hypot(qx - p[0], qy - p[1]) > 90))
      points.push(p);
  }
  const links: string[] = [];
  for (let i = 0; i < points.length; i++)
    for (let j = i + 1; j < points.length; j++)
      if (
        Math.hypot(points[i][0] - points[j][0], points[i][1] - points[j][1]) <
          150 &&
        random() < 0.5
      )
        links.push(
          `M ${f1(points[i][0])} ${f1(points[i][1])} L ${f1(points[j][0])} ${f1(points[j][1])}`
        );
  // Seeded apart from the field, so the stars stay where the frames have
  // them. Each twinkles on its own cycle, started partway through.
  const phase = mulberry32(5);
  return {
    stars: points.map(([x, y], i) => {
      const star: Star = {
        x: +f1(x),
        y: +f1(y),
        r: i % 5 ? 1 : 1.5,
        opacity: (i % 5 ? 0.35 : 0.6) * 0.8
      };
      if (i % 4 === 0) {
        const duration = 3.5 + phase() * 4;
        star.twinkle = {
          duration: `${duration.toFixed(2)}s`,
          delay: `${(-phase() * duration).toFixed(2)}s`
        };
      }
      return star;
    }),
    links: links.join(' ')
  };
})();
