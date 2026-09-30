'use client';

import type { ReactNode } from 'react';
import { useMagnetic } from '@/hooks/useMagnetic';
import styles from './IconSquare.module.scss';

// The navbar's pull, so these feel like the social squares.
const PULL = { strength: 0.2, innerStrength: 0.1 };

interface IconSquareBase {
  /** What it does, for assistive tech (the square shows only its glyph). */
  label: string;
  /** The glyph. */
  children: ReactNode;
  className?: string;
}

type IconSquareProps = IconSquareBase &
  (
    | { href: string; onClick?: never }
    | { href?: never; onClick: () => void; pressed?: boolean }
  );

// Figma "Navbar / Social" (square), reused on the release pages: a
// gilt-framed square with one glyph, as a link out (a platform) or as a
// button (copy link). It fills gilt on hover, like the social squares.
export default function IconSquare(props: IconSquareProps) {
  const { ref, innerRef } = useMagnetic<HTMLElement, HTMLSpanElement>(PULL);
  const className = props.className
    ? `${styles.square} ${props.className}`
    : styles.square;
  const content = (
    <span ref={innerRef} className={styles.glyph}>
      {props.children}
    </span>
  );

  if (props.href !== undefined)
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement | null>}
        className={className}
        href={props.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
        <span className={styles.srOnly}>
          {props.label} (opens in a new tab)
        </span>
      </a>
    );

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement | null>}
      type="button"
      className={className}
      onClick={props.onClick}
    >
      {content}
      <span className={styles.srOnly}>{props.label}</span>
    </button>
  );
}
