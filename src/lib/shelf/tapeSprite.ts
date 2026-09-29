// Geometry shared by every tape render in public/img/discography/tapes: they
// all come from one fixed camera (turned 30°, tipped 24°), so they share a
// size, the point the shell's centre lands on, and a silhouette. Measured
// from the renders; fractions of the image, so any resize keeps them.

export const TAPE_SPRITE = {
  width: 1206,
  height: 1078,
  /** The shell's centre, which the shelf places on its line. */
  anchor: { x: 0.4497, y: 0.5461 },
  /** The visible faces' outline, for hit-testing (clip-path polygon). */
  hull: [
    [0.0274, 0.1656],
    [0.0821, 0.1224],
    [0.872, 0.3299],
    [0.872, 0.9266],
    [0.8173, 0.9697],
    [0.0274, 0.7622]
  ],
  /** Screen direction of "away from the viewer" along the row (up and right). */
  rowDir: { x: 0.8175, y: -0.5759 }
} as const;

export const TAPE_HULL_CLIP = `polygon(${TAPE_SPRITE.hull
  .map(([x, y]) => `${(x * 100).toFixed(2)}% ${(y * 100).toFixed(2)}%`)
  .join(', ')})`;
