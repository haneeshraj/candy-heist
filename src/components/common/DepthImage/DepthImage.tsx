'use client';

import { useRef } from 'react';
import { useDepthScene } from './useDepthScene';
import { DEPTH_IMAGE_SAVED_PRESET } from './DepthImage.types';
import styles from './DepthImage.module.scss';
import type { DepthImageProps } from './DepthImage.types';

export default function DepthImage({
  colorSrc,
  depthSrc,
  className,
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
    interactive,
    frameZoom,
    focalX,
    focalY
  });

  return (
    <canvas
      ref={canvasRef}
      className={className ? `${styles.canvas} ${className}` : styles.canvas}
      data-ready={ready}
    />
  );
}
