import type { SVGProps } from 'react';

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'>;

export interface BaseIconProps extends IconProps {
  /** SVG path data drawn on the shared 12 × 12 icon grid. */
  path: string;
}
