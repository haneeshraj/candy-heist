'use client';

import { useEffect, type RefObject } from 'react';
import { EASE_SIGNATURE, gsap } from '@/lib/animation/gsap';
import { revealOnce } from '@/lib/animation/reveal';
import {
  BELOW_DESKTOP_QUERY,
  DESKTOP_QUERY,
  MOTION_OK_QUERY
} from '@/lib/constants/breakpoints';
import type { SessionsReveals, TextReveal } from './SessionsSection.types';

// Everything moves. Desktop is scroll-scrubbed, like the About section: the
// photo settles and its dark side sweeps in as the section crosses the
// viewport, the header writes itself in, then each service draws its rule,
// turns its glyph in, decodes its name and lifts its line. The text
// components hand over their reveals as timelines, so the letters and words
// scrub with the scroll too. Mobile plays each group once as it enters view.
// The scrubbed ranges are clamp()ed so they stay inside the scrollable range.

type Select = (selector: string) => Element[];

const SCRUB = 0.6; // seconds of catch-up on top of Lenis' own smoothing
const BACK = 'back.out(1.7)';
const ROW_GAP = 0.55; // stagger between services on the scrubbed list

const hook = (name: string) => `[data-motion="${name}"]`;

// Nests a text component's reveal at `at`. A missing handle is a no-op.
function addText(
  tl: gsap.core.Timeline,
  reveal: TextReveal | null | undefined,
  at: gsap.Position
) {
  if (reveal) tl.add(reveal.timeline(), at);
}

function scrollScrubbed(root: HTMLElement, q: Select, text: SessionsReveals) {
  // Backdrop: the photo pushes back and the left fade arrives for as long
  // as any of the section is on screen (Frame adds its own parallax).
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
    .fromTo(q(hook('photo')), { scale: 1.22 }, { scale: 1, duration: 1 }, 0)
    .fromTo(
      q(hook('fade-left')),
      { xPercent: -45 },
      { xPercent: 0, duration: 0.45 },
      0
    );

  // Header: label and status, the headline, the intro, then the one action.
  const head = gsap.timeline({
    defaults: { ease: EASE_SIGNATURE },
    scrollTrigger: {
      trigger: root,
      start: 'clamp(top 80%)',
      end: 'clamp(top 5%)',
      scrub: SCRUB
    }
  });
  head.from(
    q(hook('label-sigil')),
    { autoAlpha: 0, rotation: -180, duration: 0.9 },
    0
  );
  addText(head, text.label, 0.1);
  head.from(
    q(hook('status-dot')),
    { scale: 0, duration: 0.6, ease: BACK },
    0.2
  );
  addText(head, text.status, 0.3);
  addText(head, text.lead, 0.5);
  addText(head, text.statement, 0.9);
  addText(head, text.intro, 1.5);
  head.from(q(hook('cta')), { autoAlpha: 0, y: 24, duration: 0.9 }, 2.1);

  // Services, one after another down the column.
  const rows = q(hook('service'));
  const list = gsap.timeline({
    defaults: { ease: EASE_SIGNATURE },
    scrollTrigger: {
      trigger: q(hook('list'))[0],
      start: 'clamp(top 88%)',
      end: 'clamp(bottom 62%)',
      scrub: SCRUB
    }
  });
  rows.forEach((row, i) => {
    const at = i * ROW_GAP;
    const inRow = gsap.utils.selector(row);
    list
      .fromTo(
        inRow(hook('rule')),
        { scaleX: 0 },
        { scaleX: 1, duration: 1, ease: 'power2.inOut' },
        at
      )
      .from(
        inRow(hook('icon')),
        { autoAlpha: 0, scale: 0.4, rotation: -90, duration: 0.8, ease: BACK },
        at + 0.2
      );
    addText(list, text.names[i], at + 0.3);
    addText(list, text.summaries[i], at + 0.55);
  });
  list.fromTo(
    q(hook('rule-end')),
    { scaleX: 0 },
    { scaleX: 1, duration: 1, ease: 'power2.inOut' },
    rows.length * ROW_GAP
  );
}

// Each group plays once, the first time it scrolls into view.
function onView(root: HTMLElement, q: Select, text: SessionsReveals) {
  revealOnce(q(hook('backdrop'))[0], (tl) =>
    tl.fromTo(q(hook('photo')), { scale: 1.15 }, { scale: 1, duration: 1.8 })
  );

  revealOnce(q(hook('topline'))[0], (tl) => {
    tl.from(
      q(hook('label-sigil')),
      { autoAlpha: 0, rotation: -180, duration: 0.8 },
      0
    );
    addText(tl, text.label, 0.1);
    tl.from(
      q(hook('status-dot')),
      { scale: 0, duration: 0.5, ease: BACK },
      0.2
    );
    addText(tl, text.status, 0.3);
  });

  revealOnce(q(hook('headline'))[0], (tl) => {
    addText(tl, text.lead, 0);
    addText(tl, text.statement, 0.3);
  });

  revealOnce(q(hook('intro'))[0], (tl) => {
    addText(tl, text.intro, 0);
    tl.from(q(hook('cta')), { autoAlpha: 0, y: 12, duration: 0.6 }, 0.5);
  });

  q(hook('service')).forEach((row, i) => {
    const inRow = gsap.utils.selector(row);
    revealOnce(row, (tl) => {
      tl.fromTo(
        inRow(hook('rule')),
        { scaleX: 0 },
        { scaleX: 1, duration: 0.7, ease: 'power2.out' },
        0
      ).from(
        inRow(hook('icon')),
        { autoAlpha: 0, scale: 0.4, rotation: -90, duration: 0.6, ease: BACK },
        0.1
      );
      addText(tl, text.names[i], 0.15);
      addText(tl, text.summaries[i], 0.3);
    });
  });

  revealOnce(q(hook('rule-end'))[0], (tl) =>
    tl.fromTo(
      q(hook('rule-end')),
      { scaleX: 0 },
      { scaleX: 1, duration: 0.7, ease: 'power2.out' }
    )
  );
}

// Reduced motion: every text lands on its final state at once. The text
// components' own reduced-motion check can't be relied on this early (it
// only settles after mount), so jump each reveal to its end instead, with
// callbacks suppressed so no scramble flickers.
function settle(text: SessionsReveals) {
  [
    text.label,
    text.status,
    text.lead,
    text.statement,
    text.intro,
    ...text.names,
    ...text.summaries
  ].forEach((reveal) => reveal?.timeline().progress(1, true));
}

export function useSessionsMotion(
  rootRef: RefObject<HTMLElement | null>,
  revealsRef: RefObject<SessionsReveals>
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
        else onView(root, q, text);
      },
      root
    );

    return () => mm.revert();
  }, [rootRef, revealsRef]);
}
