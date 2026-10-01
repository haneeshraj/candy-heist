'use client';

import { useLenis } from 'lenis/react';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject
} from 'react';
import { gsap, ScrollTrigger } from '@/lib/animation/gsap';
import type { BookingStep } from '@/lib/booking/bookingState';

// Holds the step on screen a beat behind the one asked for: the old step
// fades up and out, the page returns to the top, then the new step mounts
// and plays its own entrance. Back from a service to the list, it lands
// on the list (the step marks it data-step-return) rather than the top. `instant` skips the fade once (a restore
// opening straight onto a later step); reduced motion always skips it.
// Room above the list when landing back on it.
const RETURN_OFFSET = 32;

export function useStepTransition(
  step: BookingStep,
  stageRef: RefObject<HTMLElement | null>,
  instantRef: RefObject<boolean>
) {
  const [shown, setShown] = useState(step);
  const fromRef = useRef(shown);
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
    const from = fromRef.current;
    fromRef.current = shown;
    if (!stage) return;
    gsap.set(stage, { autoAlpha: 1, y: 0 });
    const mark =
      from === 'item' && shown === 'intro'
        ? stage.querySelector<HTMLElement>('[data-step-return]')
        : null;
    const top = mark
      ? mark.getBoundingClientRect().top + window.scrollY - RETURN_OFFSET
      : 0;
    if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
    else window.scrollTo(0, top);
    // The page's height changed; triggers further down need re-measuring.
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(frame);
    // Scroll on a swap only, not when Lenis arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  return shown;
}
