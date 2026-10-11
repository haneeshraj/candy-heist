'use client';

import type { CSSProperties } from 'react';
import styles from './Slider.module.scss';
import type { SliderProps } from './Slider.types';

// One control of a tool: its name in mono, what it's set to, and a gilt
// track to drag. A native range input underneath, so the keyboard, touch
// and screen readers all work as they do anywhere else.
export default function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  format,
  onChange
}: SliderProps) {
  const shown = format(value);
  const fill = ((value - min) / Math.max(max - min, Number.EPSILON)) * 100;
  return (
    <div className={styles.slider}>
      <div className={styles.head}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        <output className={styles.value} htmlFor={id}>
          {shown}
        </output>
      </div>
      <input
        id={id}
        className={styles.range}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={shown}
        style={{ '--fill': `${fill}%` } as CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
