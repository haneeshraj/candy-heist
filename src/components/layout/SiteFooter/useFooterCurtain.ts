'use client';

import { useLayoutEffect, type RefObject } from 'react';
import { ScrollTrigger } from '@/lib/animation/gsap';

/**
 * The curtain reveal: the footer stays pinned to the bottom of the screen,
 * behind the page, and the page's end lifts away to uncover it (the CSS
 * does it, with position: sticky). Only when the whole footer fits on
 * screen: a taller one pinned like that would never show its top, so it
 * just scrolls in as usual. Marks the footer with data-curtain and
 * re-measures the scroll triggers whenever that changes.
 */
export function useFooterCurtain(rootRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const update = () => {
      const fits = root.offsetHeight <= window.innerHeight;
      if ((root.dataset.curtain === 'true') === fits) return;
      root.dataset.curtain = String(fits);
      ScrollTrigger.refresh();
    };

    update();
    window.addEventListener('resize', update);
    const ro =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    ro?.observe(root);
    return () => {
      window.removeEventListener('resize', update);
      ro?.disconnect();
      delete root.dataset.curtain;
    };
  }, [rootRef]);
}

// Where the page's end (the content drawn over the footer) sits in the
// document, or null without one.
function pageEnd(root: HTMLElement) {
  const content = root.previousElementSibling;
  return content
    ? content.getBoundingClientRect().bottom + window.scrollY
    : null;
}

/**
 * The scroll position at which the page's end reaches the foot of the
 * screen and starts to lift off the footer. On a page shorter than the
 * screen that's above the top: the footer peeks out from the start (the
 * site layout leaves it a strip).
 */
export function curtainLift(root: HTMLElement) {
  const end = pageEnd(root);
  if (end === null) return 0;
  return Math.min(
    end - window.innerHeight,
    ScrollTrigger.maxScroll(window) - 1
  );
}

/**
 * The scroll position at which the curtain has uncovered half of `el`.
 * The footer is pinned with its bottom on the screen's, so the curtain's
 * edge (the page's end) passes the footer from the bottom up.
 */
export function curtainStart(root: HTMLElement, el: Element) {
  const end = pageEnd(root);
  if (end === null) return 0;
  const offset =
    el.getBoundingClientRect().top - root.getBoundingClientRect().top;
  const height = el.getBoundingClientRect().height;
  const screen = window.innerHeight;
  // Where el's middle sits on screen while the footer is pinned.
  const pinnedMiddle = screen - root.offsetHeight + offset + height / 2;
  return Math.min(end - pinnedMiddle, ScrollTrigger.maxScroll(window) - 1);
}
