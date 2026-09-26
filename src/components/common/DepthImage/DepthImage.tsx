'use client';

import { useRef, type CSSProperties } from 'react';
import { useDepthScene } from './useDepthScene';
import { DEPTH_IMAGE_SAVED_PRESET } from './DepthImage.types';
import styles from './DepthImage.module.scss';
import type { DepthImageProps } from './DepthImage.types';

export default function DepthImage({
  colorSrc,
  depthSrc,
  className,
  enabled = true,
  interactive = true,
  frameZoom = 1,
  focalX = 0.5,
  focalY = 0.5,
  ...overrides
}: DepthImageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const settings = { ...DEPTH_IMAGE_SAVED_PRESET, ...overrides };
  const { ready } = useDepthScene(canvasRef, {
    ...settings,
    colorSrc,
    depthSrc,
    enabled,
    interactive,
    frameZoom,
    focalX,
    focalY
  });

  // Same canvas element whether or not WebGL runs, so there's no
  // element-type swap (and no flash) once `enabled` resolves after mount.
  // Disabled just means: never touch WebGL, show colorSrc as a plain
  // cover-fit CSS background instead, and treat it as always "ready".
  const style: CSSProperties | undefined = enabled
    ? undefined
    : {
        backgroundImage: `url(${colorSrc})`,
        backgroundSize: 'cover',
        backgroundPosition: `${focalX * 100}% ${focalY * 100}%`,
        backgroundRepeat: 'no-repeat'
      };

  return (
    <canvas
      ref={canvasRef}
      className={className ? `${styles.canvas} ${className}` : styles.canvas}
      data-ready={enabled ? ready : true}
      style={style}
    />
  );
}
