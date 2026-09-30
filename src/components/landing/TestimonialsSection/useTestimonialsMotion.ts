'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { gsap } from '@/lib/animation/gsap';
import { revealOnce } from '@/lib/animation/reveal';
import { DESKTOP_QUERY, MOTION_OK_QUERY } from '@/lib/constants/breakpoints';
import type {
  TestimonialsReveals,
  TextReveal
} from './TestimonialsSection.types';

// From the Figma board "TESTIMONIALS", IV v2. Not scroll-scrubbed: the
// quotes keep their own time, so the section plays in once as it comes
// into view, on every screen. The photo settles in, the label, headline
// and first quote write themselves in, then the dots and the button; the
// rotation starts when that's done. On desktop the photo then keeps a slow
// push in and out behind it (scroll parallax comes from Frame).

type Select = (selector: string) => Element[];

const hook = (name: string) => `[data-motion="${name}"]`;

// Nests a text component's reveal at `at`. A missing handle is a no-op.
function addText(
  tl: gsap.core.Timeline,
  reveal: TextReveal | null | undefined,
  at: gsap.Position
) {
  if (reveal) tl.add(reveal.timeline(), at);
}

function playIn(
  q: Select,
  text: TestimonialsReveals,
  desktop: boolean,
  onDone: () => void
) {
  const [photo] = q(hook('photo'));
  const firstCredit = q(`${hook('slide')}:first-child ${hook('credit')}`);
  revealOnce(q(hook('column'))[0], (tl) => {
    tl.from(q(hook('backdrop')), { autoAlpha: 0, duration: 1.2 }, 0)
      .from(photo, { scale: 1.08, duration: 1.8 }, 0)
      .from(
        q(hook('label-sigil')),
        { autoAlpha: 0, rotation: -180, duration: 0.8 },
        0.1
      );
    addText(tl, text.label, 0.2);
    addText(tl, text.lead, 0.35);
    addText(tl, text.statement, 0.6);
    tl.from(q(hook('quote-mark')), { autoAlpha: 0, y: 16, duration: 0.7 }, 0.9);
    addText(tl, text.quotes[0], 1);
    tl.from(firstCredit, { autoAlpha: 0, y: 8, duration: 0.6 }, 1.6)
      .from(q(hook('controls')), { autoAlpha: 0, y: 8, duration: 0.6 }, 1.8)
      .from(q(hook('cta')), { autoAlpha: 0, y: 12, duration: 0.6 }, 1.9)
      .eventCallback('onComplete', () => {
        onDone();
        // The slow push in and out, from where the settle left it.
        if (desktop && photo)
          gsap.to(photo, {
            scale: 1.05,
            duration: 18,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
          });
      });
  });
}

// Reduced motion: every text lands on its final state at once, and the
// quotes don't rotate (see useQuoteRotation).
function settle(text: TestimonialsReveals) {
  [text.label, text.lead, text.statement, ...text.quotes].forEach((reveal) =>
    reveal?.timeline().progress(1, true)
  );
}

export function useTestimonialsMotion(
  rootRef: RefObject<HTMLElement | null>,
  revealsRef: RefObject<TestimonialsReveals>,
  onRevealed: () => void
) {
  // The latest callback, without re-running the effect for a new one.
  const doneRef = useRef(onRevealed);
  useEffect(() => {
    doneRef.current = onRevealed;
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mm = gsap.matchMedia();
    mm.add(
      {
        motion: MOTION_OK_QUERY,
        desktop: `${DESKTOP_QUERY} and ${MOTION_OK_QUERY}`,
        reduced: '(prefers-reduced-motion: reduce)'
      },
      (context) => {
        const q = gsap.utils.selector(root);
        const text = revealsRef.current;
        if (context.conditions?.reduced) {
          settle(text);
          doneRef.current();
        } else {
          playIn(q, text, Boolean(context.conditions?.desktop), () =>
            doneRef.current()
          );
        }
      },
      root
    );

    return () => mm.revert();
  }, [rootRef, revealsRef]);
}
