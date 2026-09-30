'use client';

import { useEffect, type RefObject } from 'react';
import { gsap } from '@/lib/animation/gsap';
import { DESKTOP_QUERY, MOTION_OK_QUERY } from '@/lib/constants/breakpoints';

// The lore index's choreography, on desktop: the orrery behind the page is
// scrubbed by the scroll. The arrival's planet (A0) steps aside as the
// orbit draws in round it, node by node, its dust with it (A1), and the
// stars drift the whole way. Under that, the stage's own steady motion
// (the dust turning, the stars twinkling, the Omun beating) runs on.

const hook = (name: string) => `[data-motion="${name}"]`;
const MOVE = 'power2.inOut';

// The planet's and the orbit's poses, relative to the index's (A1), where
// the stylesheet's arrival transform starts them. The x and y are zeroed
// too: GSAP reads the stylesheet's translate as pixels the first time it
// touches them, and would otherwise keep them.
const POSE = {
  arrival: {
    planet: {
      x: 0,
      y: 0,
      xPercent: -77.7778,
      yPercent: -24.0741,
      scale: 1.1111
    },
    orbit: { x: 0, y: 0, xPercent: -38.8889, yPercent: -12.037, scale: 1.1111 }
  },
  index: {
    planet: { x: 0, y: 0, xPercent: 0, yPercent: 0, scale: 1 },
    orbit: { x: 0, y: 0, xPercent: 0, yPercent: 0, scale: 1 }
  }
} as const;

function orrery(root: HTMLElement) {
  const q = gsap.utils.selector(root);
  const [planet] = q(`${hook('stage')} ${hook('planet')}`);
  const [orbit] = q(hook('orbit'));
  const [index] = q(hook('index'));
  if (!planet || !orbit || !index) return;
  const nodes = q(hook('node'));

  gsap.fromTo(
    q(`${hook('stage')} > ${hook('stars')}`),
    { yPercent: 0, rotation: 0 },
    {
      yPercent: -8,
      rotation: 5,
      ease: 'none',
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true
      }
    }
  );

  // A0 → A1: the planet steps aside and the orbit draws in, node by node.
  gsap
    .timeline({
      defaults: { ease: 'none', immediateRender: false },
      scrollTrigger: {
        trigger: index,
        start: 'top bottom',
        end: 'top top',
        scrub: 0.6
      }
    })
    .fromTo(
      planet,
      POSE.arrival.planet,
      { ...POSE.index.planet, duration: 1, ease: MOVE },
      0
    )
    .fromTo(
      orbit,
      POSE.arrival.orbit,
      { ...POSE.index.orbit, duration: 1, ease: MOVE },
      0
    )
    .fromTo(
      q(hook('orbit-ring')),
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 0.8 },
      0.1
    )
    .fromTo(
      q(hook('motes')),
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.5 },
      0.4
    )
    .fromTo(
      nodes,
      { autoAlpha: 0, scale: 0 },
      {
        autoAlpha: 1,
        scale: 1,
        duration: 0.2,
        stagger: 0.55 / nodes.length,
        ease: 'back.out(2)'
      },
      0.35
    );
}

export function useLoreMotion(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mm = gsap.matchMedia();
    mm.add(`${DESKTOP_QUERY} and ${MOTION_OK_QUERY}`, () => orrery(root), root);
    return () => mm.revert();
  }, [rootRef]);
}
