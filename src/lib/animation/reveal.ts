import { EASE_SIGNATURE, gsap, ScrollTrigger } from './gsap';

// A play-once reveal starts when its top passes 85% of the viewport, but
// never later than 1px before the end of the page. clamp() alone isn't
// enough here: it pins the start to exactly max scroll, where progress is 0
// and a once-trigger never fires, so the last element on the page stayed
// hidden. Recomputed on every ScrollTrigger refresh.
export const revealStart = (trigger: Element) => () =>
  Math.min(
    trigger.getBoundingClientRect().top +
      window.scrollY -
      window.innerHeight * 0.85,
    ScrollTrigger.maxScroll(window) - 1
  );

// Builds a timeline that plays once, the first time `trigger` scrolls into
// view. A missing trigger (an optional element that didn't render) is a no-op.
export function revealOnce(
  trigger: Element | undefined,
  build: (timeline: gsap.core.Timeline) => void
) {
  if (!trigger) return;
  build(
    gsap.timeline({
      defaults: { ease: EASE_SIGNATURE },
      scrollTrigger: { trigger, start: revealStart(trigger), once: true }
    })
  );
}
