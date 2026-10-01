'use client';

import { useEffect, type RefObject } from 'react';
import { ScrollTrigger } from '@/lib/animation/gsap';
import { setAtPageEnd } from '@/lib/scroll/pageEnd';
import { curtainLift } from './useFooterCurtain';

/**
 * Tells the scroll hint (lib/scroll/pageEnd) when the page rests at its
 * end with the footer still under it: under the curtain, scrolled to
 * where scrolling stops (useFooterLanding). Checked as it scrolls, when
 * the triggers re-measure, and when the page or the footer change size
 * (a new page, a resize).
 */
export function useFooterAtEnd(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const update = () =>
      setAtPageEnd(
        root.dataset.curtain === 'true' &&
          Math.abs(window.scrollY - curtainLift(root)) < 2
      );

    update();
    window.addEventListener('scroll', update, { passive: true });
    ScrollTrigger.addEventListener('refresh', update);
    const ro =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    ro?.observe(root);
    if (root.previousElementSibling) ro?.observe(root.previousElementSibling);

    return () => {
      window.removeEventListener('scroll', update);
      ScrollTrigger.removeEventListener('refresh', update);
      ro?.disconnect();
      setAtPageEnd(false);
    };
  }, [rootRef]);
}
