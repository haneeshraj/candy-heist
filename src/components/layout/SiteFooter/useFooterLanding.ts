'use client';

import { useLenis } from 'lenis/react';
import { useEffect, type RefObject } from 'react';
import { createLanding } from '@/lib/scroll/landing';
import { steerWheel } from '@/lib/scroll/wheel';
import { curtainLift } from './useFooterCurtain';

// Scrolling areas of their own, which Lenis leaves to the browser.
const OWN_SCROLL =
  '[data-lenis-prevent], [data-lenis-prevent-wheel], [data-lenis-prevent-vertical]';

/**
 * Under the curtain, scrolling down comes to rest with the page's end on
 * the foot of the screen, before the footer shows, and the footer is
 * uncovered only once the reader scrolls on (lib/scroll/landing). It
 * steers the wheel before Lenis scrolls (lib/scroll/wheel): the keyboard,
 * the scrollbar and links go straight through, and so does touch, which
 * scrolls natively.
 */
export function useFooterLanding(rootRef: RefObject<HTMLElement | null>) {
  const lenis = useLenis();

  useEffect(() => {
    const root = rootRef.current;
    if (!lenis || !root) return;
    const landing = createLanding();

    return steerWheel((data) => {
      const { event } = data;
      if (
        root.dataset.curtain !== 'true' ||
        event.type !== 'wheel' ||
        event.ctrlKey ||
        lenis.isStopped ||
        lenis.isLocked ||
        Math.abs(data.deltaX) > Math.abs(data.deltaY) ||
        (event.target instanceof Element && event.target.closest(OWN_SCROLL))
      ) {
        return true;
      }

      const step = landing.wheel({
        delta: data.deltaY,
        at: event.timeStamp,
        target: lenis.targetScroll,
        current: lenis.animatedScroll,
        landing: curtainLift(root)
      });
      if (step.kind === 'land') data.deltaY = step.delta;
      if (step.kind === 'hold') {
        // Held: Lenis lets go of the event, so the browser mustn't take it.
        if (event.cancelable) event.preventDefault();
        return false;
      }
      return true;
    });
  }, [lenis, rootRef]);
}
