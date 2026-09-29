import type { ElementType } from 'react';

export type CubicBezier = readonly [number, number, number, number];

export interface MotionTextProps {
  /** The real text, read once by assistive tech; the animated pieces are decorative. */
  text: string;
  /** Wrapping element. @default 'span' */
  as?: ElementType;
  className?: string;
  /** Seconds before the first piece starts. @default 0 */
  delay?: number;
  /** Seconds between pieces (letters or words). @default 0.1 */
  stagger?: number;
  /** Seconds each piece takes. @default 0.7 */
  duration?: number;
  /** Cubic-bezier for each piece. @default [0.51, 0, 0, 0.97] */
  ease?: CubicBezier;
}

export interface WordBlockRevealProps extends MotionTextProps {
  /** Colour of the block that sweeps across before the letters rise. @default var(--color-gilt) */
  blockColor?: string;
}
