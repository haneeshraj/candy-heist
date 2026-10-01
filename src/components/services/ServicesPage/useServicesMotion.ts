'use client';

import { useLayoutEffect, type RefObject } from 'react';
import { EASE_SIGNATURE, gsap, ScrollTrigger } from '@/lib/animation/gsap';
import { MOTION_OK_QUERY } from '@/lib/constants/breakpoints';

// The services page's motion, on every screen (it isn't a scrubbed page):
// the headline writes itself in on its own (its text components play on
// mount); each door unveils from its foot as it comes into view, the photo
// settling from a push-in, then its words and its button rise after it,
// the doors a beat apart; how it works draws its rule across and brings
// its steps in. Reduced motion leaves everything where it is.
export function useServicesMotion(rootRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add(
      MOTION_OK_QUERY,
      () => {
        const q = gsap.utils.selector(root);
        const doors = q('[data-motion="door"]') as HTMLElement[];

        gsap.set(doors, { clipPath: 'inset(100% 0% 0% 0%)' });
        ScrollTrigger.batch(doors, {
          start: 'top 88%',
          once: true,
          onEnter: (batch) =>
            batch.forEach((door, i) => {
              const inDoor = gsap.utils.selector(door);
              gsap
                .timeline({
                  delay: i * 0.16,
                  defaults: { ease: EASE_SIGNATURE }
                })
                .to(door, {
                  clipPath: 'inset(0% 0% 0% 0%)',
                  duration: 1.3,
                  clearProps: 'clipPath'
                })
                .from(
                  inDoor('[data-motion="door-media"]'),
                  { scale: 1.18, duration: 1.8 },
                  0
                )
                .from(
                  inDoor('[data-motion="door-text"]'),
                  { autoAlpha: 0, y: 24, duration: 0.9, stagger: 0.09 },
                  0.55
                )
                .from(
                  inDoor('[data-motion="door-cta"]'),
                  { autoAlpha: 0, y: 16, duration: 0.8 },
                  0.85
                );
            })
        });

        const how = q('[data-motion="how"]')[0];
        if (how) {
          gsap
            .timeline({
              defaults: { ease: EASE_SIGNATURE },
              scrollTrigger: { trigger: how, start: 'top 85%', once: true }
            })
            .from(q('[data-motion="how-rule"]'), {
              scaleX: 0,
              transformOrigin: '0 50%',
              duration: 1.2
            })
            .from(
              q('[data-motion="how-label"]'),
              { autoAlpha: 0, y: 12, duration: 0.7 },
              0.2
            )
            .from(
              q('[data-motion="how-step"]'),
              { autoAlpha: 0, y: 24, duration: 0.9, stagger: 0.12 },
              0.35
            );
        }
      },
      root
    );
    return () => mm.revert();
  }, [rootRef]);
}
