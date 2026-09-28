'use client';

import { useEffect, type RefObject } from 'react';
import { gsap } from '@/lib/animation/gsap';
import { revealOnce } from '@/lib/animation/reveal';
import { MOTION_OK_QUERY } from '@/lib/constants/breakpoints';

// Choreography from the Figma "On-view Spec — Footer R · Mobile", used on
// every breakpoint: each group plays once as it scrolls into view, never
// scrubbed. The footer ends the page, so revealOnce fires the lower groups
// at the last scrollable pixel when they can't reach the usual 85% mark.
// Reduced motion doesn't match, so the settled layout just shows.

const BACK = 'back.out(1.7)';

const hook = (name: string) => `[data-motion="${name}"]`;

export function useFooterMotion(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mm = gsap.matchMedia();
    mm.add(
      MOTION_OK_QUERY,
      () => {
        const q = gsap.utils.selector(root);
        const first = (name: string) => q(hook(name))[0];

        revealOnce(first('lead'), (tl) =>
          tl
            .from(q(hook('lead')), { autoAlpha: 0, y: 16, duration: 0.7 }, 0)
            .from(
              q(hook('statement')),
              { autoAlpha: 0, y: 24, duration: 0.7 },
              0.12
            )
        );

        // The mark turns into place around its own eye while the photo
        // inside settles; the crimson eye lands last.
        revealOnce(first('vortex'), (tl) =>
          tl
            .from(
              q(hook('vortex')),
              { autoAlpha: 0, rotation: 8, scale: 1.06, duration: 1 },
              0
            )
            .fromTo(
              q(hook('vortex-photo')),
              { scale: 1.1 },
              { scale: 1, duration: 1.2 },
              0
            )
            .from(q(hook('eye')), { scale: 0, duration: 0.5, ease: BACK }, 0.7)
        );

        revealOnce(first('email'), (tl) =>
          tl.from(q(hook('email')), { autoAlpha: 0, y: 12, duration: 0.6 })
        );

        revealOnce(first('column'), (tl) =>
          tl.from(q(hook('column')), {
            autoAlpha: 0,
            y: 12,
            duration: 0.6,
            stagger: 0.08
          })
        );

        revealOnce(first('rule'), (tl) =>
          tl
            .fromTo(
              q(hook('rule')),
              { scaleX: 0 },
              { scaleX: 1, duration: 0.6 },
              0
            )
            .from(q(hook('copyright')), { autoAlpha: 0, duration: 0.6 }, 0.1)
        );
      },
      root
    );

    return () => mm.revert();
  }, [rootRef]);
}
