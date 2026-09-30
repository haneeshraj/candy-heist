'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
  type RefObject
} from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EASE_SIGNATURE, gsap } from '@/lib/animation/gsap';
import { MOTION_OK_QUERY } from '@/lib/constants/breakpoints';
import type { TestimonialsReveals } from './TestimonialsSection.types';

interface Options {
  count: number;
  rootRef: RefObject<HTMLElement | null>;
  /** The quotes' slides, in order. */
  slidesRef: RefObject<Array<HTMLElement | null>>;
  revealsRef: RefObject<TestimonialsReveals>;
  /** The section has played in: only then does the rotation start. */
  revealed: boolean;
}

const moves = () => window.matchMedia(MOTION_OK_QUERY).matches;

// Which quote is showing, and whether the rotation runs. It runs only once
// the section has played in, while at least a third of it is on screen and
// the tab is showing, and never while the pointer is over it, focus is in
// it, the visitor has paused it or motion is reduced. Changing quotes, the
// one showing lifts away, then the next one's words rise in and its credit
// after them.
export function useQuoteRotation({
  count,
  rootRef,
  slidesRef,
  revealsRef,
  revealed
}: Options) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();
  const leavingRef = useRef<gsap.core.Tween | null>(null);
  const shownRef = useRef(0);

  const rotates = count > 1 && !reduced;
  const running =
    rotates && revealed && visible && !hovering && !focused && !paused;

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    let onScreen = false;
    const update = () => setVisible(onScreen && !document.hidden);
    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        update();
      },
      { threshold: 0.35 }
    );
    observer.observe(root);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, [rootRef]);

  const goTo = useCallback(
    (next: number) => {
      const target = ((next % count) + count) % count;
      if (target === shownRef.current) return;
      leavingRef.current?.kill();
      const leaving = slidesRef.current[shownRef.current];
      if (!moves() || !leaving) {
        setActive(target);
        return;
      }
      leavingRef.current = gsap.to(leaving, {
        autoAlpha: 0,
        y: -10,
        duration: 0.35,
        ease: 'power1.in',
        onComplete: () => setActive(target)
      });
    },
    [count, slidesRef]
  );

  // The next one in, before it's painted, so its words start hidden.
  useLayoutEffect(() => {
    if (active === shownRef.current) return;
    shownRef.current = active;
    slidesRef.current.forEach((slide) => {
      if (slide)
        gsap.set(slide, { clearProps: 'opacity,visibility,transform' });
    });
    const entering = slidesRef.current[active];
    if (!entering || !moves()) return;
    // Hidden first: a quote shown before would otherwise just appear.
    const quote = revealsRef.current.quotes[active];
    quote?.reset();
    void quote?.play();
    gsap.fromTo(
      entering.querySelectorAll('[data-motion="credit"]'),
      { autoAlpha: 0, y: 8 },
      { autoAlpha: 1, y: 0, duration: 0.6, delay: 0.45, ease: EASE_SIGNATURE }
    );
  }, [active, slidesRef, revealsRef]);

  useEffect(
    () => () => {
      leavingRef.current?.kill();
    },
    []
  );

  return {
    active,
    running,
    rotates,
    paused,
    goTo,
    next: () => goTo(shownRef.current + 1),
    togglePause: () => setPaused((p) => !p),
    // Hover only counts for a mouse: a tap would never "leave".
    hoverProps: {
      onPointerEnter: (e: PointerEvent) => {
        if (e.pointerType === 'mouse') setHovering(true);
      },
      onPointerLeave: (e: PointerEvent) => {
        if (e.pointerType === 'mouse') setHovering(false);
      }
    },
    focusProps: {
      onFocus: () => setFocused(true),
      onBlur: (e: FocusEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null))
          setFocused(false);
      }
    }
  };
}
