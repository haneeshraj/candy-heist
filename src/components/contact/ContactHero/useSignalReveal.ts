'use client';

import { useEffect, type RefObject } from 'react';
import { gsap } from '@/lib/animation/gsap';
import { revealOnce } from '@/lib/animation/reveal';
import { MOTION_OK_QUERY } from '@/lib/constants/breakpoints';

// The signal goes out once, when the hero comes into view: the sigil turns
// in, the horizon draws out from the centre, the source opens, the rings
// ripple out one after another and a pulse travels out through them. The
// text components reveal themselves alongside. Reduced motion doesn't match,
// so the settled drawing just shows.

const BACK = 'back.out(1.7)';

const hook = (name: string) => `[data-motion="${name}"]`;

export function useSignalReveal(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mm = gsap.matchMedia();
    mm.add(
      MOTION_OK_QUERY,
      () => {
        const q = gsap.utils.selector(root);
        // Rings and pulses scale around the source, the drawing's (0, 0).
        gsap.set([...q(hook('ring')), ...q(hook('pulse'))], {
          svgOrigin: '0 0'
        });
        const [pulse] = q(hook('pulse'));

        revealOnce(root, (tl) => {
          tl.from(
            q(hook('label-sigil')),
            { autoAlpha: 0, rotation: -180, duration: 0.8 },
            0
          )
            .fromTo(
              q(hook('horizon')),
              { scaleX: 0 },
              { scaleX: 1, duration: 1, ease: 'power2.out' },
              0.2
            )
            .from(
              q(hook('source')),
              { scale: 0, duration: 0.5, ease: BACK },
              0.4
            )
            .from(
              q(hook('source-halo')),
              { autoAlpha: 0, scale: 0.3, duration: 0.8 },
              0.6
            )
            .fromTo(
              q(hook('ring')),
              { autoAlpha: 0, scale: 0.3 },
              { autoAlpha: 1, scale: 1, duration: 1.2, stagger: 0.12 },
              0.5
            )
            .from(q(hook('bearings')), { autoAlpha: 0, duration: 1.2 }, 1.1);
          if (pulse)
            tl.fromTo(
              pulse,
              { scale: 0.08 },
              { scale: 2.8, duration: 2.8, ease: 'power1.out' },
              1.4
            )
              .fromTo(pulse, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 1.4)
              .to(pulse, { opacity: 0, duration: 2.6, ease: 'power1.in' }, 1.6);
        });
      },
      root
    );

    return () => mm.revert();
  }, [rootRef]);
}
