'use client';

import { useLayoutEffect, type RefObject } from 'react';
import { gsap, ScrollTrigger } from '@/lib/animation/gsap';
import { revealOnce } from '@/lib/animation/reveal';
import { DESKTOP_QUERY, MOTION_OK_QUERY } from '@/lib/constants/breakpoints';
import type { RevealMap } from '../reveals';

const hook = (name: string) => `[data-motion="${name}"]`;

// On desktop this text rises in under the banner as the journey ends, so
// it starts revealing the moment it's on screen rather than 85% of the way
// up, and is read as it arrives.
const onEntry = (trigger: Element) => () =>
  Math.min(
    trigger.getBoundingClientRect().top +
      window.scrollY -
      window.innerHeight * 0.98,
    ScrollTrigger.maxScroll(window) - 1
  );

// The banner, from frame 5.1 to 5.2: it arrives 360 tall and settles to
// 240 over the first 120 of scroll (as the text under it rises the same
// 120), its name and vortex shrinking to fit and its photo sliding. The
// lock point rides the ruler as the reading progress, and a little before
// halfway down the section the banner slides up and away, the pinned
// headline rising into the room it leaves. In the banner's design pixels,
// read off its height.
const EXIT_AT = 0.38; // of the section's height, scrolled past its arrival
const EXIT_LENGTH = 220; // design px of scroll the slide takes

function settle(section: HTMLElement, slot: HTMLElement) {
  const banner = slot.querySelector<HTMLElement>(hook('banner'));
  if (!banner) return;
  const part = (name: string) => banner.querySelector(hook(name));
  const dp = () => banner.getBoundingClientRect().height / 360;
  const arrived = () => `top ${360 * dp()}px`;
  const exitAt =
    (extra = 0) =>
    () =>
      `top ${360 * dp() - EXIT_AT * section.offsetHeight - extra * dp()}px`;

  gsap
    .timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: arrived,
        end: () => `top ${240 * dp()}px`,
        scrub: true,
        invalidateOnRefresh: true
      }
    })
    .fromTo(banner, { y: 0 }, { y: () => -120 * dp() }, 0)
    .fromTo(part('banner-photo'), { y: 0 }, { y: () => 60 * dp() }, 0)
    .fromTo(part('banner-fade'), { scaleY: 1 }, { scaleY: 168 / 252 }, 0)
    .fromTo(
      part('banner-logo'),
      { y: 0, scale: 1 },
      { y: () => 33.3 * dp(), scale: 44 / 68 },
      0
    )
    .fromTo(
      part('banner-name'),
      { x: 0, y: 0, scale: 1 },
      { x: () => -24 * dp(), y: () => 35 * dp(), scale: 34 / 56 },
      0
    );

  gsap
    .timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: arrived,
        end: exitAt(),
        scrub: true,
        invalidateOnRefresh: true
      }
    })
    .fromTo(part('banner-travelled'), { scaleX: 0.104 }, { scaleX: 0.896 }, 0)
    .fromTo(part('banner-lock'), { left: '10.4%' }, { left: '89.6%' }, 0);

  gsap
    .timeline({
      defaults: { immediateRender: false },
      scrollTrigger: {
        trigger: section,
        start: exitAt(),
        end: exitAt(EXIT_LENGTH),
        scrub: true,
        invalidateOnRefresh: true
      }
    })
    .fromTo(
      banner,
      { y: () => -120 * dp() },
      { y: () => -440 * dp(), ease: 'power1.in' },
      0
    )
    .fromTo(
      section.querySelector(hook('aside')),
      { y: 0 },
      { y: () => -200 * dp(), ease: 'power2.inOut' },
      0
    );

  // The section's star field turns slowly as it's read.
  gsap.fromTo(
    section.querySelector(hook('stars')),
    { yPercent: 0, rotation: 0 },
    {
      yPercent: -8,
      rotation: -3,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'clamp(bottom bottom)',
        scrub: true
      }
    }
  );
}

// Every group rises in once as it comes into view, desktop and phones
// alike; on desktop the banner settles too. Reduced motion shows it all.
export function useContinuesMotion(
  rootRef: RefObject<HTMLElement | null>,
  reveals: RefObject<RevealMap>,
  bannerRef: RefObject<HTMLElement | null>
) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mm = gsap.matchMedia();
    mm.add(
      {
        journey: `${DESKTOP_QUERY} and ${MOTION_OK_QUERY}`,
        motion: MOTION_OK_QUERY
      },
      (context) => {
        const { journey, motion } = context.conditions ?? {};
        const own = [...reveals.current].filter(([key]) =>
          key.startsWith('continues.')
        );
        if (!motion) {
          own.forEach(([, reveal]) => void reveal.play());
          return;
        }

        const q = gsap.utils.selector(root);
        const reveal = (key: string) =>
          reveals.current.get(key)?.timeline() ?? gsap.timeline();

        const early = journey ? onEntry : undefined;
        const [label] = q(hook('label'));
        revealOnce(
          label,
          (tl) => {
            tl.from(
              q(hook('label-sigil')),
              { rotation: -180, duration: 0.8 },
              0
            );
            tl.add(reveal('continues.label'), 0);
            tl.add(reveal('continues.headline'), 0.15);
          },
          early
        );
        q(`${hook('flow')} > *`).forEach((block, i) =>
          revealOnce(
            block,
            (tl) =>
              tl.add(
                reveal(i === 0 ? 'continues.lede' : `continues.p${i - 1}`)
              ),
            early
          )
        );
        // The sign-off sits just above the row of buttons.
        const [row] = q(hook('coda-row'));
        revealOnce(row?.previousElementSibling ?? undefined, (tl) =>
          tl.add(reveal('continues.closing'))
        );
        revealOnce(row, (tl) => {
          tl.from(q(`${hook('coda-row')} ${hook('social')}`), {
            autoAlpha: 0,
            y: 12,
            duration: 0.5,
            stagger: 0.08
          });
          tl.from(
            q(hook('cta')),
            { autoAlpha: 0, y: 16, duration: 0.6, stagger: 0.1 },
            0.1
          );
        });

        if (journey && bannerRef.current) settle(root, bannerRef.current);
      },
      root
    );

    return () => mm.revert();
  }, [rootRef, reveals, bannerRef]);
}
