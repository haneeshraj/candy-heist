'use client';

import { useLenis } from 'lenis/react';
import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';
import { gsap, ScrollTrigger } from '@/lib/animation/gsap';
import type { BookingStep } from '@/lib/booking/bookingState';

// Holds the step on screen a beat behind the one asked for: the old step
// fades up and out, the page returns to the top, then the new step mounts
// and plays its own entrance. `instant` skips the fade once (a restore
// opening straight onto a later step); reduced motion always skips it.
export function useStepTransition(
  step: BookingStep,
  stageRef: RefObject<HTMLElement | null>,
  instantRef: RefObject<boolean>
) {
  const [shown, setShown] = useState(step);
  const lenis = useLenis();

  useEffect(() => {
    if (step === shown) return;
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const quick = reduced || instantRef.current;
    instantRef.current = false;
    // A zero-length tween completes straight away.
    const tween = gsap.to(stageRef.current, {
      autoAlpha: 0,
      y: -12,
      duration: quick ? 0 : 0.35,
      ease: 'power2.in',
      onComplete: () => setShown(step)
    });
    return () => {
      tween.kill();
    };
  }, [step, shown, stageRef, instantRef]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    gsap.set(stage, { autoAlpha: 1, y: 0 });
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
    // The page's height changed; triggers further down need re-measuring.
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(frame);
    // Scroll on a swap only, not when Lenis arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  return shown;
}
