'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/animation/gsap';
import { FINE_POINTER_QUERY } from '@/lib/constants/breakpoints';
import { useMediaQuery } from './useMediaQuery';
import { useReducedMotion } from './useReducedMotion';

export interface MagneticOptions {
  /** Fraction of the pointer's offset from centre that the element follows. @default 0.3 */
  strength?: number;
  /** Extra fraction the inner content follows on top of that, for a sense of depth. @default 0.15 */
  innerStrength?: number;
  /** Switch the pull off entirely, e.g. for disabled controls. @default true */
  enabled?: boolean;
}

const FOLLOW = { duration: 0.6, ease: 'power3.out' };

/**
 * Pulls an element (and optionally its inner content, a little further)
 * toward the pointer while it hovers, then eases it back on leave. Only
 * runs for fine pointers without a reduced-motion preference; touch devices
 * never get it.
 */
export function useMagnetic<
  T extends HTMLElement = HTMLElement,
  I extends HTMLElement = HTMLElement
>({
  strength = 0.3,
  innerStrength = 0.15,
  enabled = true
}: MagneticOptions = {}) {
  const ref = useRef<T | null>(null);
  const innerRef = useRef<I | null>(null);
  const hasFinePointer = useMediaQuery(FINE_POINTER_QUERY);
  const reducedMotion = useReducedMotion();
  const active = enabled && hasFinePointer && !reducedMotion;

  useEffect(() => {
    const element = ref.current;
    if (!active || !element) return;
    const inner = innerRef.current;

    const moveX = gsap.quickTo(element, 'x', FOLLOW);
    const moveY = gsap.quickTo(element, 'y', FOLLOW);
    const innerX = inner ? gsap.quickTo(inner, 'x', FOLLOW) : null;
    const innerY = inner ? gsap.quickTo(inner, 'y', FOLLOW) : null;

    function onPointerMove(event: PointerEvent) {
      const rect = element!.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      moveX(dx * strength);
      moveY(dy * strength);
      innerX?.(dx * innerStrength);
      innerY?.(dy * innerStrength);
    }

    function onPointerLeave() {
      moveX(0);
      moveY(0);
      innerX?.(0);
      innerY?.(0);
    }

    element.addEventListener('pointermove', onPointerMove);
    element.addEventListener('pointerleave', onPointerLeave);

    return () => {
      element.removeEventListener('pointermove', onPointerMove);
      element.removeEventListener('pointerleave', onPointerLeave);
      const targets = inner ? [element, inner] : [element];
      gsap.killTweensOf(targets);
      gsap.set(targets, { x: 0, y: 0 });
    };
  }, [active, strength, innerStrength]);

  return { ref, innerRef, active };
}
