import type { CubicBezier } from '@/components/common/MotionText';

// Curves and clip shapes from the portfolio navbar, unchanged.

/** The pill's blocks wiping in on load. */
export const EASE_WIPE: CubicBezier = [0.5, 0, 0, 1];
/** Label letters swapping, and the panel opening and closing. */
export const EASE_SWAP: CubicBezier = [0.65, 0.05, 0.03, 1];
/** The toggle's lines drawing across. */
export const EASE_DRAW: CubicBezier = [0.57, 0, 0, 0.99];
/** Social icons popping in. */
export const EASE_POP: CubicBezier = [0.36, 0, 0, 1];

export const BLOCK_CLIP = {
  full: 'polygon(100% 0, 0 0, 0 100%, 100% 100%)',
  fromRight: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)',
  fromCentre: 'polygon(50% 0, 50% 0, 50% 100%, 50% 100%)',
  fromLeft: 'polygon(0 0, 0 0, 0 100%, 0 100%)'
} as const;

// Opens from a point at bottom centre, through a centre strip, to full;
// closes down through a low band back to the point.
export const PANEL_CLIP = {
  point: 'polygon(50% 100%, 50% 100%, 50% 100%, 50% 100%)',
  strip: 'polygon(40% 0, 60% 0, 60% 100%, 40% 100%)',
  band: 'polygon(0 70%, 100% 70%, 100% 100%, 0 100%)',
  full: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
} as const;
