'use client';

import { useMotionValue, useSpring, useTransform } from 'motion/react';
import type { PointerEvent } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { FINE_POINTER_QUERY } from '@/lib/constants/breakpoints';

/** Degrees of 3D tilt at the panel's edges. */
const MAX_TILT = 6;
/** Pixels of drift toward the pointer at the panel's edges. */
const MAX_DRIFT = 12;
// Soft enough to trail the cursor a little, and to settle back in about
// 0.8s when it leaves.
const SPRING = { stiffness: 90, damping: 18, mass: 0.8 };

/**
 * The menu's watermark vortex leaning toward the pointer: a slight 3D tilt
 * and drift, spring-smoothed. Handlers go on the panel, `style` on the
 * mark. Fine pointers only, and off with reduced motion.
 */
export function useWatermarkTilt() {
  const hasFinePointer = useMediaQuery(FINE_POINTER_QUERY);
  const reducedMotion = useReducedMotion();
  const active = hasFinePointer && !reducedMotion;

  // The pointer over the panel, -1 to 1 from its centre on each axis.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, SPRING);
  const springY = useSpring(pointerY, SPRING);
  const rotateY = useTransform(springX, (v) => v * MAX_TILT);
  const rotateX = useTransform(springY, (v) => -v * MAX_TILT);
  const x = useTransform(springX, (v) => v * MAX_DRIFT);
  const y = useTransform(springY, (v) => v * MAX_DRIFT);

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    if (!active) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
    pointerY.set(((event.clientY - rect.top) / rect.height) * 2 - 1);
  }

  function onPointerLeave() {
    pointerX.set(0);
    pointerY.set(0);
  }

  return {
    style: { rotateX, rotateY, x, y, transformPerspective: 900 },
    onPointerMove,
    onPointerLeave
  };
}
