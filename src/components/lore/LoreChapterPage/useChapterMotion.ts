'use client';

import { useEffect, type RefObject } from 'react';
import { gsap, ScrollTrigger } from '@/lib/animation/gsap';
import { DESKTOP_QUERY, MOTION_OK_QUERY } from '@/lib/constants/breakpoints';

// A chapter's choreography, on desktop. The orrery comes in as the page
// opens: Nayara in the chapter's look, the orbit drawing round her with
// this chapter at its crown, and the gold run over the chapters already
// read. Reading on fills the run towards the next node, an Omun ring
// pulses out as each passage arrives, the planet turns and the stars
// drift; the next chapter's node lights as the way on comes into view.
// Under that, the dust round the orbit turns and the stars twinkle at
// their own steady rates.

const hook = (name: string) => `[data-motion="${name}"]`;

function orrery(root: HTMLElement, index: number, count: number) {
  const q = gsap.utils.selector(root);
  const [planet] = q(`${hook('stage')} ${hook('planet')}`);
  const [arc] = q(hook('orbit-arc'));
  const [body] = q(hook('body'));
  if (!planet || !arc || !body) return;

  const nodes = q(hook('node'));
  const step = 1 / (count + 1);
  // The run is the chapters before this one, plus how far this one's read.
  const run = { before: 0, reading: 0 };
  const draw = () =>
    gsap.set(arc, {
      strokeDasharray: `${(run.before + run.reading * step).toFixed(4)} 1`
    });

  gsap
    .timeline({ defaults: { ease: 'power3.out' } })
    .fromTo(
      planet,
      { autoAlpha: 0, scale: 0.88 },
      { autoAlpha: 1, scale: 1, duration: 1.4 },
      0
    )
    .fromTo(
      q(hook('orbit-ring')),
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' },
      0.15
    )
    .fromTo(
      q(hook('motes')),
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 2 },
      0.6
    )
    .fromTo(
      nodes,
      { autoAlpha: 0, scale: 0 },
      {
        autoAlpha: 1,
        scale: 1,
        duration: 0.5,
        stagger: 0.04,
        ease: 'back.out(2)'
      },
      0.5
    )
    .to(
      run,
      {
        before: index * step,
        duration: 1.2,
        ease: 'power2.inOut',
        onUpdate: draw
      },
      0.9
    )
    .fromTo(
      q(hook('caption')),
      { autoAlpha: 0, y: 12 },
      { autoAlpha: 1, y: 0, duration: 0.8 },
      1.1
    );

  const reading = gsap.quickTo(run, 'reading', {
    duration: 0.6,
    ease: 'power2.out',
    onUpdate: draw
  });
  ScrollTrigger.create({
    trigger: body,
    start: 'top 60%',
    end: 'bottom 60%',
    onUpdate: (self) => reading(self.progress)
  });

  // The planet turns a little, and the stars drift, over the page.
  const page = { trigger: root, start: 'top top', end: 'bottom bottom' };
  gsap.fromTo(
    q(hook('planet-turn')),
    { rotation: 0 },
    { rotation: 14, ease: 'none', scrollTrigger: { ...page, scrub: 0.6 } }
  );
  gsap.fromTo(
    q(`${hook('stage')} > ${hook('stars')}`),
    { yPercent: 0, rotation: 0 },
    {
      yPercent: -8,
      rotation: 5,
      ease: 'none',
      scrollTrigger: { ...page, scrub: true }
    }
  );

  // An Omun ring pulses out from the planet as each passage arrives.
  const pulses = q(hook('pulse'));
  let next = 0;
  q(`${hook('body')} > *`).forEach((block) =>
    ScrollTrigger.create({
      trigger: block,
      start: 'top 70%',
      onEnter: () => {
        const ring = pulses[next++ % pulses.length];
        if (ring)
          gsap.fromTo(
            ring,
            { autoAlpha: 0.9, scale: 1 },
            { autoAlpha: 0, scale: 1.8, duration: 2.4, ease: 'power2.out' }
          );
      }
    })
  );

  // The next chapter's node (or the one still being written) lights up
  // as the way on comes into view.
  const [way] = q(hook('next'));
  const upcoming = nodes[index + 1];
  if (way && upcoming)
    ScrollTrigger.create({
      trigger: way,
      start: 'top 80%',
      onToggle: (self) =>
        upcoming.toggleAttribute('data-upcoming', self.isActive)
    });
}

export function useChapterMotion(
  rootRef: RefObject<HTMLElement | null>,
  index: number,
  count: number
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mm = gsap.matchMedia();
    mm.add(
      `${DESKTOP_QUERY} and ${MOTION_OK_QUERY}`,
      () => orrery(root, index, count),
      root
    );
    return () => mm.revert();
  }, [rootRef, index, count]);
}
