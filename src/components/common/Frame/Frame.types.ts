import type { ElementType, ReactNode } from 'react';

export interface FrameProps {
  children: ReactNode;
  className?: string;
  /** Wrapping element/tag. @default 'div' */
  as?: ElementType;
  /** border-radius passed through, any valid CSS length. @default 0 */
  radius?: number | string;
  /** Max px the content can travel up/down as the frame crosses the viewport. @default 160 */
  travel?: number;
  /**
   * 'auto' enables the scroll-parallax only at the desktop breakpoint and
   * when the user hasn't asked for reduced motion; touch/mobile always get
   * a static, exactly-framed child. Pass a boolean to force it either way.
   * @default 'auto'
   */
  parallax?: boolean | 'auto';
}
