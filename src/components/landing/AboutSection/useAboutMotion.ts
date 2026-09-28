'use client';

import { useEffect, type RefObject } from 'react';
import { EASE_SIGNATURE, gsap } from '@/lib/animation/gsap';
import { revealOnce } from '@/lib/animation/reveal';
import {
  BELOW_DESKTOP_QUERY,
  DESKTOP_QUERY,
  MOTION_OK_QUERY
} from '@/lib/constants/breakpoints';

// Choreography mirrors the Figma specs: "Scroll Map — Nave v3" (desktop,
// scroll-scrubbed) and "On-view Spec — Nave v3 · Mobile". Each group is
// anchored to its own element rather than one section-wide timeline, so
// every part plays as it actually enters view whatever the viewport height.
// Reduced motion matches neither query, so the settled layout just shows.
// The scrubbed triggers are wrapped in clamp() so they stay inside the
// scrollable range: while this is the last section, "copy top at 55%" can't
// be scrolled to, and an unclamped end would leave the CTA half-faded.

type Select = (selector: string) => Element[];

const SCRUB = 0.6; // seconds of catch-up on top of Lenis' own smoothing
const BACK = 'back.out(1.7)';
// Same format as the computed value so GSAP can interpolate towards the CSS
// glow, whose size is set per breakpoint in the stylesheet.
const GLOW_OFF = 'rgba(163, 43, 35, 0.85) 0px 0px 0px 0px';

const hook = (name: string) => `[data-motion="${name}"]`;

function scrollScrubbed(root: HTMLElement, q: Select) {
  // World geometry drifts for as long as any of the section is on screen.
  gsap
    .timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: root,
        start: 'clamp(top bottom)',
        end: 'clamp(bottom top)',
        scrub: true
      }
    })
    .fromTo(q(hook('rings')), { scale: 0.72 }, { scale: 1.12, duration: 1 }, 0)
    .fromTo(q(hook('rings')), { opacity: 0 }, { opacity: 1, duration: 0.25 }, 0)
    .to(q(hook('rings')), { opacity: 0.55, duration: 0.75 }, 0.25)
    .fromTo(
      q(hook('spokes')),
      { rotation: 0 },
      { rotation: -14, duration: 1 },
      0
    )
    .fromTo(
      q(hook('spokes')),
      { opacity: 0 },
      { opacity: 1, duration: 0.25 },
      0.05
    )
    .fromTo(q(hook('dust-far')), { y: 0 }, { y: -70, duration: 1 }, 0)
    .fromTo(
      q(hook('dust-mid')),
      { x: 0, y: 0 },
      { x: 12, y: -160, duration: 1 },
      0
    )
    .fromTo(
      q(hook('dust-near')),
      { x: 0, y: 0 },
      { x: -18, y: -300, duration: 1 },
      0
    );

  // Invocation: the hero's hairline drops into the orb, the label arrives.
  gsap
    .timeline({
      defaults: { ease: EASE_SIGNATURE },
      scrollTrigger: {
        trigger: root,
        start: 'clamp(top 90%)',
        end: 'clamp(top 30%)',
        scrub: SCRUB
      }
    })
    .fromTo(
      q(hook('line')),
      { scaleY: 0 },
      { scaleY: 1, duration: 0.8, ease: 'none' },
      0
    )
    .from(q(hook('label')), { autoAlpha: 0, x: -24, duration: 0.8 }, 0.1)
    .from(q(hook('label-sigil')), { rotation: -180, duration: 1 }, 0.1)
    .from(
      q(hook('halo')),
      { autoAlpha: 0, scale: 0.2, duration: 0.7, ease: BACK },
      0.5
    )
    .from(q(hook('orb')), { scale: 0, duration: 0.6, ease: BACK }, 0.5)
    .from(q(hook('orb')), { boxShadow: GLOW_OFF, duration: 1 }, 0.7);

  // Identity + credentials: the monument assembles around the photo.
  gsap
    .timeline({
      defaults: { ease: EASE_SIGNATURE },
      scrollTrigger: {
        trigger: q(hook('stage'))[0],
        start: 'clamp(top 85%)',
        end: 'clamp(bottom 65%)',
        scrub: SCRUB
      }
    })
    .fromTo(
      q(hook('rib-outer')),
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 1.6, ease: 'power1.inOut' },
      0
    )
    .fromTo(
      q(hook('rib-inner')),
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 1.6, ease: 'power1.inOut' },
      0.2
    )
    .from(
      q(hook('arch')),
      { autoAlpha: 0, duration: 0.3, ease: 'power1.out' },
      0.4
    )
    .fromTo(
      q(hook('veil')),
      { yPercent: 0 },
      { yPercent: 100, duration: 2.4 },
      0.6
    )
    .fromTo(
      q(hook('photo')),
      { scale: 1.24 },
      { scale: 1.06, duration: 3.2 },
      0.6
    )
    .from(q(hook('head-left')), { autoAlpha: 0, x: -40, duration: 1.2 }, 0.6)
    .from(q(hook('head-right')), { autoAlpha: 0, x: 40, duration: 1.2 }, 0.9)
    .from(q(hook('pilaster')), { autoAlpha: 0, y: 80, duration: 1 }, 2.2)
    .from(
      q(hook('fact-left')),
      { autoAlpha: 0, x: -48, duration: 0.9, stagger: 0.3 },
      2.6
    )
    .from(
      q(hook('fact-right')),
      { autoAlpha: 0, x: 48, duration: 0.9, stagger: 0.3 },
      2.7
    )
    .fromTo(q(hook('floor')), { scaleX: 0 }, { scaleX: 1, duration: 1.2 }, 2.8);

  // Interpretation: the copy rises in under the floor line.
  gsap
    .timeline({
      defaults: { ease: EASE_SIGNATURE },
      scrollTrigger: {
        trigger: q(hook('copy'))[0],
        start: 'clamp(top 92%)',
        end: 'clamp(top 55%)',
        scrub: SCRUB
      }
    })
    .from(q(hook('body')), { autoAlpha: 0, y: 40, duration: 1.2 }, 0)
    .from(q(hook('aside')), { autoAlpha: 0, y: 24, duration: 1 }, 0.5)
    .from(q(hook('cta')), { autoAlpha: 0, y: 16, duration: 0.8 }, 1.2);
}

// Each group plays once, the first time it scrolls into view.
function onView(root: HTMLElement, q: Select) {
  revealOnce(root, (tl) =>
    tl
      .fromTo(
        q(hook('line')),
        { scaleY: 0 },
        { scaleY: 1, duration: 0.6, ease: 'power2.out' },
        0
      )
      .from(q(hook('label')), { autoAlpha: 0, x: -12, duration: 0.6 }, 0)
      .from(q(hook('label-sigil')), { rotation: -180, duration: 0.8 }, 0)
      .from(
        q(hook('halo')),
        { autoAlpha: 0, scale: 0.2, duration: 0.5, ease: BACK },
        0.3
      )
      .from(q(hook('orb')), { scale: 0, duration: 0.5, ease: BACK }, 0.3)
      .from(q(hook('orb')), { boxShadow: GLOW_OFF, duration: 0.8 }, 0.4)
  );

  revealOnce(q(hook('arch'))[0], (tl) =>
    tl
      .fromTo(
        q(hook('rib-outer')),
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 0.9 },
        0
      )
      .fromTo(
        q(hook('rib-inner')),
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 0.9 },
        0.1
      )
      .from(q(hook('arch')), { autoAlpha: 0, duration: 0.3 }, 0)
      .fromTo(
        q(hook('veil')),
        { yPercent: 0 },
        { yPercent: 100, duration: 0.9 },
        0.2
      )
      .fromTo(
        q(hook('photo')),
        { scale: 1.12 },
        { scale: 1, duration: 1.2 },
        0.2
      )
      .from(q(hook('pilaster')), { autoAlpha: 0, duration: 0.6 }, 0.4)
      .fromTo(
        q(hook('floor')),
        { scaleX: 0 },
        { scaleX: 1, duration: 0.6 },
        0.5
      )
  );

  revealOnce(q(hook('head-left'))[0], (tl) =>
    tl.from([...q(hook('head-left')), ...q(hook('head-right'))], {
      autoAlpha: 0,
      y: 16,
      duration: 0.7,
      stagger: 0.12
    })
  );

  // Reading order on the 2 × 2 grid: Origin, Discipline, Based in, Established.
  const left = q(hook('fact-left'));
  const right = q(hook('fact-right'));
  const facts = left.flatMap((fact, i) =>
    right[i] ? [fact, right[i]] : [fact]
  );
  revealOnce(facts[0], (tl) =>
    tl.from(facts, { autoAlpha: 0, y: 12, duration: 0.6, stagger: 0.08 })
  );

  revealOnce(q(hook('divider'))[0], (tl) =>
    tl.fromTo(q(hook('divider')), { scaleX: 0 }, { scaleX: 1, duration: 0.6 })
  );
  revealOnce(q(hook('body'))[0], (tl) =>
    tl.from(q(hook('body')), { autoAlpha: 0, y: 16, duration: 0.7 })
  );
  revealOnce(q(hook('aside'))[0], (tl) =>
    tl.from(q(hook('aside')), { autoAlpha: 0, y: 12, duration: 0.6 }, 0.1)
  );
  revealOnce(q(hook('cta'))[0], (tl) =>
    tl.from(q(hook('cta')), { autoAlpha: 0, y: 8, duration: 0.5 }, 0.2)
  );
}

export function useAboutMotion(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mm = gsap.matchMedia();
    mm.add(
      {
        desktop: `${DESKTOP_QUERY} and ${MOTION_OK_QUERY}`,
        mobile: `${BELOW_DESKTOP_QUERY} and ${MOTION_OK_QUERY}`
      },
      (context) => {
        const q = gsap.utils.selector(root);
        if (context.conditions?.desktop) scrollScrubbed(root, q);
        else onView(root, q);
      },
      root
    );

    return () => mm.revert();
  }, [rootRef]);
}
