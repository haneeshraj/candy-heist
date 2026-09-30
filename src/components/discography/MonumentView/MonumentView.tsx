'use client';

import { useLenis } from 'lenis/react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { SigilChip } from '@/components/common/SigilChip';
import { ArrowIcon } from '@/components/icons';
import type { DiscographyCopy } from '@/content/discography/discography';
import { releaseHref } from '@/content/discography/links';
import { gsap } from '@/lib/animation/gsap';
import { DESKTOP_QUERY, MOTION_OK_QUERY } from '@/lib/constants/breakpoints';
import {
  artistLine,
  metaLine,
  type ReleaseSummary
} from '@/lib/discography/summary';
import { fill } from '@/lib/text/fill';
import { ReleaseCard } from '../ReleaseCard';
import styles from './MonumentView.module.scss';

interface MonumentViewProps {
  copy: DiscographyCopy['page'];
  releases: ReleaseSummary[];
}

// How far the page scrolls for each release on the rail, in screens.
const STEP = 0.5;

// Figma "Discography — Monument view": one release a screen. On desktop
// the stage pins under the bar and the scroll runs the rail of covers
// sideways, settling on each in turn; the one in front carries its title,
// huge, in outline behind it. The scrubber lists every cover and jumps to
// one. Reduced motion keeps the stage still and steps it from the
// scrubber; phones swipe a strip of covers instead.
export default function MonumentView({ copy, releases }: MonumentViewProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLOListElement | null>(null);
  const goRef = useRef<((index: number) => void) | null>(null);
  const [active, setActive] = useState(0);
  const lenis = useLenis();
  const count = releases.length;
  const current = releases[Math.min(active, count - 1)];

  // Scroll-driven on desktop: the rail follows the scroll (a CSS variable,
  // --offset, from 0 to the last release) and snaps to each.
  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const rail = railRef.current;
    if (!root || !stage || !rail || count < 2) return;
    const mm = gsap.matchMedia();
    mm.add(`${DESKTOP_QUERY} and ${MOTION_OK_QUERY}`, () => {
      rail.dataset.driven = 'true';
      const tween = gsap.fromTo(
        rail,
        { '--offset': 0 },
        {
          '--offset': count - 1,
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: () => `+=${(count - 1) * window.innerHeight * STEP}`,
            pin: stage,
            scrub: 0.6,
            snap: {
              snapTo: 1 / (count - 1),
              duration: { min: 0.2, max: 0.6 },
              ease: 'power2.inOut'
            },
            invalidateOnRefresh: true,
            onUpdate: (self) =>
              setActive(Math.round(self.progress * (count - 1)))
          }
        }
      );
      goRef.current = (index) => {
        const trigger = tween.scrollTrigger;
        if (!trigger) return;
        const y =
          trigger.start + (trigger.end - trigger.start) * (index / (count - 1));
        if (lenis) lenis.scrollTo(y, { duration: 1.2 });
        else window.scrollTo({ top: y, behavior: 'smooth' });
      };
      return () => {
        goRef.current = null;
        delete rail.dataset.driven;
        rail.style.removeProperty('--offset');
      };
    });
    return () => mm.revert();
  }, [count, lenis]);

  // Otherwise the rail steps to the chosen release.
  useEffect(() => {
    const rail = railRef.current;
    if (rail && !rail.dataset.driven)
      rail.style.setProperty('--offset', String(active));
  }, [active]);

  const go = (index: number) => {
    if (goRef.current) goRef.current(index);
    else setActive(index);
  };

  return (
    <section ref={rootRef} className={styles.monument}>
      <div ref={stageRef} className={styles.stage}>
        <div className={styles.frame}>
          <div className={styles.showcase}>
            <p
              key={current.slug}
              className={styles.backdrop}
              aria-hidden="true"
            >
              {current.title}
            </p>
            <ol ref={railRef} className={styles.rail}>
              {releases.map((release, i) => (
                <li
                  key={release.slug}
                  className={styles.slide}
                  data-active={i === active || undefined}
                >
                  <Link
                    className={styles.slideLink}
                    href={releaseHref(release.slug)}
                    tabIndex={i === active ? 0 : -1}
                    aria-hidden={i === active ? undefined : true}
                  >
                    <Image
                      src={release.cover.src}
                      alt=""
                      fill
                      sizes="440px"
                      priority={i < 2}
                      className={styles.slideImage}
                    />
                    <span className={styles.srOnly}>{release.title}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>

          <div className={styles.captionRow}>
            <div className={styles.caption} aria-live="polite">
              <p
                className={styles.meta}
                data-forthcoming={current.forthcoming || undefined}
              >
                {metaLine(current, copy.forthcoming)}
              </p>
              <p className={styles.artist}>{artistLine(current)}</p>
            </div>
            <div className={styles.open}>
              <SigilChip href={releaseHref(current.slug)} icon={<ArrowIcon />}>
                {copy.open}
              </SigilChip>
            </div>
          </div>

          <div className={styles.scrubberRow}>
            <p className={styles.hint} aria-hidden="true">
              ← {copy.scroll} →
            </p>
            <ol className={styles.scrubber}>
              {releases.map((release, i) => (
                <li key={release.slug}>
                  <button
                    type="button"
                    className={styles.thumb}
                    data-active={i === active || undefined}
                    data-forthcoming={release.forthcoming || undefined}
                    aria-current={i === active ? 'true' : undefined}
                    aria-label={fill(copy.goTo, { title: release.title })}
                    onClick={() => go(i)}
                  >
                    <Image src={release.cover.src} alt="" fill sizes="44px" />
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <ul className={styles.strip}>
        {releases.map((release) => (
          <li key={release.slug} className={styles.stripItem}>
            <ReleaseCard
              release={release}
              forthcoming={copy.forthcoming}
              sizes="78vw"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
