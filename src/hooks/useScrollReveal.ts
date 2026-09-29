'use client';

import { useLayoutEffect, type RefObject } from 'react';
import { EASE_SIGNATURE, gsap, ScrollTrigger } from '@/lib/animation/gsap';
import { MOTION_OK_QUERY } from '@/lib/constants/breakpoints';

const ROOT = 'data-reveal-root';

// Everything under `ref` marked [data-reveal] waits below its place and
// rises in, a few at a time, as it scrolls into view. For long content,
// where an entrance on mount would play out of sight. Reduced motion leaves
// it all where it is. Like useEntrance, nested reveal roots keep their own
// elements.
export function useScrollReveal(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.setAttribute(ROOT, '');
    const mm = gsap.matchMedia();
    mm.add(
      MOTION_OK_QUERY,
      () => {
        const targets = Array.from(
          root.querySelectorAll<HTMLElement>('[data-reveal]')
        ).filter((el) => el.parentElement?.closest(`[${ROOT}]`) === root);
        if (!targets.length) return;
        gsap.set(targets, { autoAlpha: 0, y: 32 });
        ScrollTrigger.batch(targets, {
          start: 'top 92%',
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              autoAlpha: 1,
              y: 0,
              duration: 0.9,
              ease: EASE_SIGNATURE,
              stagger: 0.08,
              overwrite: true
            })
        });
      },
      root
    );
    return () => {
      mm.revert();
      root.removeAttribute(ROOT);
    };
  }, [ref]);
}
