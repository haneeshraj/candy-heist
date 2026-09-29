'use client';

import { useEffect, type RefObject } from 'react';
import { ScrollTrigger } from '@/lib/animation/gsap';

/**
 * Re-measures every scroll trigger when `ref` changes height: a web font
 * swapping in, an image loading, copy reflowing. ScrollTrigger only
 * re-measures on window resize and load on its own, so a long, scroll-driven
 * page would otherwise keep the positions it measured first and fire its
 * animations early or late. One refresh per frame, at most.
 */
export function useScrollRefresh(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    let height = el.offsetHeight;
    let frame = 0;
    const ro = new ResizeObserver(() => {
      if (el.offsetHeight === height) return;
      height = el.offsetHeight;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [ref]);
}
