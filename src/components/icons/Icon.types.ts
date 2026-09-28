import type { SVGProps } from 'react';

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'>;

// `path` replaces the SVG attribute of the same name, which a glyph never uses.
export interface BaseIconProps extends Omit<IconProps, 'path'> {
  /**
   * SVG path data drawn on the shared 12 × 12 icon grid. Pass several paths
   * for a glyph built from separate shapes (a ring and a dot, say), so each
   * fills on its own instead of cutting holes where they overlap.
   */
  path: string | readonly string[];
}
