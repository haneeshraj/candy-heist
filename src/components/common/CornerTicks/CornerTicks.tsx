import type { CSSProperties } from 'react';
import styles from './CornerTicks.module.scss';
import type { CornerTicksProps } from './CornerTicks.types';

// Four gilt L-marks framing whatever they're placed in (Figma "Deco /
// Corner ticks"). The parent needs position: relative; `inset` pushes the
// marks outside its edges (positive) or inside them (negative).
export default function CornerTicks({
  inset = 8,
  size = 18,
  className
}: CornerTicksProps) {
  const style = {
    '--ticks-inset': `${-inset}px`,
    '--ticks-size': `${size}px`
  } as CSSProperties;

  return (
    <span
      className={className ? `${styles.ticks} ${className}` : styles.ticks}
      style={style}
      data-motion="ticks"
      aria-hidden="true"
    >
      <span className={styles.tick} data-corner="tl" />
      <span className={styles.tick} data-corner="tr" />
      <span className={styles.tick} data-corner="bl" />
      <span className={styles.tick} data-corner="br" />
    </span>
  );
}
