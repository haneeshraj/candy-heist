'use client';

import { useEffect, type RefObject } from 'react';
import { EASE_SIGNATURE, gsap, ScrollTrigger } from '@/lib/animation/gsap';
import { revealOnce } from '@/lib/animation/reveal';
import {
  BELOW_DESKTOP_QUERY,
  DESKTOP_QUERY,
  MOTION_OK_QUERY
} from '@/lib/constants/breakpoints';
import type { ContactReveals, TextReveal } from './ContactSection.types';

// Choreography from the Figma board "CONTACT — CHOSEN · V Broadcast".
// Desktop is scroll-scrubbed: the copy writes itself in as the section
// enters, then the horizon draws out, the source opens and the rings ripple
// out one after another, and the Contact button lands last; as the section
// leaves, two pulses travel out through the rings. Each group is anchored to
// the section rather than to one timeline for the whole scroll, so it plays
// where it's actually on screen. clamp() keeps every range inside the
// scrollable page (the footer's curtain stops the scroll short). Mobile
// plays each group once as it enters view.

type Select = (selector: string) => Element[];

const SCRUB = 0.6; // seconds of catch-up on top of Lenis' own smoothing
const BACK = 'back.out(1.7)';
const RIPPLE = 0.3; // between rings on the scrubbed timeline

const hook = (name: string) => `[data-motion="${name}"]`;

// Nests a text component's reveal at `at`. A missing handle is a no-op.
function addText(
  tl: gsap.core.Timeline,
  reveal: TextReveal | null | undefined,
  at: gsap.Position
) {
  if (reveal) tl.add(reveal.timeline(), at);
}

// The horizon is at the very foot of the section, so the usual 85% line
// would leave the rings above it blank for a while. Start as it clears the
// bottom tenth of the screen instead (above the phone's navbar), never
// later than the last scrollable pixel.
const horizonStart = (trigger: Element) => () =>
  Math.min(
    trigger.getBoundingClientRect().top +
      window.scrollY -
      window.innerHeight * 0.9,
    ScrollTrigger.maxScroll(window) - 1
  );

// Rings and pulses scale around the source, the SVG's (0, 0).
function fromSource(q: Select) {
  gsap.set([...q(hook('ring')), ...q(hook('pulse'))], { svgOrigin: '0 0' });
}

function scrollScrubbed(root: HTMLElement, q: Select, text: ContactReveals) {
  fromSource(q);

  // The copy, top down, then the two ways to reach out.
  const head = gsap.timeline({
    defaults: { ease: EASE_SIGNATURE },
    scrollTrigger: {
      trigger: root,
      start: 'clamp(top 80%)',
      end: 'clamp(top 20%)',
      scrub: SCRUB
    }
  });
  head.from(
    q(hook('label-sigil')),
    { autoAlpha: 0, rotation: -180, duration: 0.9 },
    0
  );
  addText(head, text.label, 0.1);
  addText(head, text.lead, 0.4);
  addText(head, text.statement, 0.8);
  addText(head, text.intro, 1.4);
  head.from(
    q(hook('channel')),
    { autoAlpha: 0, y: 24, duration: 0.8, stagger: 0.2 },
    2
  );

  // The signal: horizon, source, the ripple, the bearings, then Contact.
  gsap
    .timeline({
      defaults: { ease: EASE_SIGNATURE },
      scrollTrigger: {
        trigger: root,
        start: 'clamp(top 50%)',
        end: 'clamp(bottom 90%)',
        scrub: SCRUB
      }
    })
    .fromTo(
      q(hook('horizon')),
      { scaleX: 0 },
      { scaleX: 1, duration: 1.4, ease: 'power2.inOut' },
      0
    )
    .from(q(hook('source')), { scale: 0, duration: 0.6, ease: BACK }, 0.6)
    .from(
      q(hook('source-halo')),
      { autoAlpha: 0, scale: 0.3, duration: 1.2 },
      1
    )
    .fromTo(
      q(hook('ring')),
      { autoAlpha: 0, scale: 0.3 },
      { autoAlpha: 1, scale: 1, duration: 1.6, stagger: RIPPLE },
      1
    )
    .from(
      q(hook('bearings')),
      { autoAlpha: 0, duration: 1.5, ease: 'none' },
      2.1
    )
    .from(q(hook('cta')), { autoAlpha: 0, scale: 0.92, duration: 0.7 }, 3.6);

  // Leaving: the signal keeps sending, two pulses a beat apart.
  const tail = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: root,
      start: 'clamp(bottom 95%)',
      end: 'clamp(bottom top)',
      scrub: true
    }
  });
  q(hook('pulse')).forEach((pulse, i) => {
    const at = i * 1.5;
    tail
      .fromTo(pulse, { scale: 0.08 }, { scale: 2.8, duration: 4 }, at)
      .fromTo(pulse, { opacity: 0 }, { opacity: 1, duration: 0.3 }, at)
      .to(pulse, { opacity: 0, duration: 3.7, ease: 'power1.in' }, at + 0.3);
  });
}

// Each group plays once, the first time it scrolls into view.
function onView(q: Select, text: ContactReveals) {
  fromSource(q);

  revealOnce(q(hook('head'))[0], (tl) => {
    tl.from(
      q(hook('label-sigil')),
      { autoAlpha: 0, rotation: -180, duration: 0.8 },
      0
    );
    addText(tl, text.label, 0.1);
    addText(tl, text.lead, 0.2);
    addText(tl, text.statement, 0.45);
    addText(tl, text.intro, 0.7);
  });

  revealOnce(q(hook('channels'))[0], (tl) =>
    tl.from(q(hook('channel')), {
      autoAlpha: 0,
      y: 12,
      duration: 0.6,
      stagger: 0.1
    })
  );

  const [pulse] = q(hook('pulse'));
  revealOnce(
    q(hook('horizon'))[0],
    (tl) =>
      tl
        .fromTo(
          q(hook('horizon')),
          { scaleX: 0 },
          { scaleX: 1, duration: 0.8, ease: 'power2.out' },
          0
        )
        .from(q(hook('source')), { scale: 0, duration: 0.5, ease: BACK }, 0.2)
        .from(
          q(hook('source-halo')),
          { autoAlpha: 0, scale: 0.3, duration: 0.8 },
          0.4
        )
        .fromTo(
          q(hook('ring')),
          { autoAlpha: 0, scale: 0.3 },
          { autoAlpha: 1, scale: 1, duration: 1.1, stagger: 0.12 },
          0.3
        )
        .from(q(hook('bearings')), { autoAlpha: 0, duration: 1 }, 0.9)
        .from(q(hook('cta')), { autoAlpha: 0, y: 12, duration: 0.6 }, 0.6)
        .fromTo(
          pulse,
          { scale: 0.08 },
          { scale: 2.8, duration: 2.6, ease: 'power1.out' },
          1.2
        )
        .fromTo(pulse, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 1.2)
        .to(pulse, { opacity: 0, duration: 2.4, ease: 'power1.in' }, 1.4),
    horizonStart
  );
}

// Reduced motion: every text lands on its final state at once (see
// useSessionsMotion for why the components' own check can't be relied on).
// The backdrop's resting state is already the settled one.
function settle(text: ContactReveals) {
  [text.label, text.lead, text.statement, text.intro].forEach((reveal) =>
    reveal?.timeline().progress(1, true)
  );
}

export function useContactMotion(
  rootRef: RefObject<HTMLElement | null>,
  revealsRef: RefObject<ContactReveals>
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mm = gsap.matchMedia();
    mm.add(
      {
        desktop: `${DESKTOP_QUERY} and ${MOTION_OK_QUERY}`,
        mobile: `${BELOW_DESKTOP_QUERY} and ${MOTION_OK_QUERY}`,
        reduced: '(prefers-reduced-motion: reduce)'
      },
      (context) => {
        const q = gsap.utils.selector(root);
        const text = revealsRef.current;
        if (context.conditions?.reduced) settle(text);
        else if (context.conditions?.desktop) scrollScrubbed(root, q, text);
        else onView(q, text);
      },
      root
    );

    return () => mm.revert();
  }, [rootRef, revealsRef]);
}
