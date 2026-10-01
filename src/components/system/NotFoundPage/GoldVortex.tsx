'use client';

import { useEffect, useRef, useState } from 'react';
import { VORTEX_MARK_SRC, VortexMark } from '@/components/common/VortexMark';
import { MOTION_OK_QUERY } from '@/lib/constants/breakpoints';
import styles from './NotFoundPage.module.scss';
import type { GoldVortexProps } from './NotFoundPage.types';
import type { VortexScene } from './vortexScene';

function canRender() {
  try {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2') ?? probe.getContext('webgl'));
  } catch {
    return false;
  }
}

// The mark in solid gold, turning (see vortexScene). three.js and the
// scene load only here, after the page is up; until then, and wherever
// WebGL isn't there, the flat gold mark stands in its place.
export default function GoldVortex({ className, label }: GoldVortexProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canRender()) return;
    let scene: VortexScene | null = null;
    let cancelled = false;
    const reduced = !window.matchMedia(MOTION_OK_QUERY).matches;
    Promise.all([
      import('./vortexScene'),
      fetch(VORTEX_MARK_SRC).then((response) => response.text())
    ])
      .then(([{ createVortexScene }, svg]) => {
        if (cancelled) return;
        scene = createVortexScene(canvas, svg, {
          reduced,
          onReady: () => setReady(true)
        });
      })
      .catch(() => {
        // The flat mark stays.
      });
    return () => {
      cancelled = true;
      scene?.dispose();
    };
  }, []);

  return (
    <div
      className={[styles.vortex, className].filter(Boolean).join(' ')}
      data-ready={ready}
      role="img"
      aria-label={label}
    >
      <VortexMark className={styles.flat} />
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
