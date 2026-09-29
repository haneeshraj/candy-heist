'use client';

import { useLayoutEffect, type RefObject } from 'react';
import { EASE_SIGNATURE, gsap } from '@/lib/animation/gsap';
import { MOTION_OK_QUERY } from '@/lib/constants/breakpoints';

export interface EntranceOptions {
  /** Seconds before the first element moves. @default 0 */
  delay?: number;
  /** Seconds between elements. @default 0.07 */
  stagger?: number;
  /** Px each element rises from. @default 28 */
  y?: number;
}

const ROOT = 'data-entrance-root';

// Everything under `ref` marked [data-enter] rises in, in document order,
// when the component mounts. It runs before paint, so nothing flashes in
// its final place first; reduced motion leaves it all where it is.
//
// Entrances nest: a component with its own entrance inside another keeps
// its elements to itself. (Two tweens from on the same element would have
// the outer one start where the inner one had just hidden it, and leave it
// hidden.) Inner layout effects run first, so their roots are marked by the
// time the outer one looks.
export function useEntrance(
  ref: RefObject<HTMLElement | null>,
  { delay = 0, stagger = 0.07, y = 28 }: EntranceOptions = {}
) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.setAttribute(ROOT, '');
    const mm = gsap.matchMedia();
    mm.add(
      MOTION_OK_QUERY,
      () => {
        const targets = Array.from(
          root.querySelectorAll('[data-enter]')
        ).filter((el) => el.parentElement?.closest(`[${ROOT}]`) === root);
        if (!targets.length) return;
        gsap.from(targets, {
          autoAlpha: 0,
          y,
          duration: 0.9,
          ease: EASE_SIGNATURE,
          stagger,
          delay
        });
      },
      root
    );
    return () => {
      mm.revert();
      root.removeAttribute(ROOT);
    };
  }, [ref, delay, stagger, y]);
}
