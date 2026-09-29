'use client';

import { useLenis } from 'lenis/react';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { SigilChip } from '@/components/common/SigilChip';
import { ArrowIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import { gsap } from '@/lib/animation/gsap';
import SessionDetail from './SessionDetail';
import SessionOption from './SessionOption';
import styles from './SessionStep.module.scss';
import type { SessionStepProps } from './SessionStep.types';

// Figma "D1 · 2 Session details": the sessions stay put in a sticky rail on
// the left, with the one action under them, while the chosen session's
// details scroll on the right. Picking another fades the details out and
// writes the new ones in. On a phone the rail becomes a swipeable row and
// the action sticks to the bottom of the screen.
export default function SessionStep({
  copy,
  services,
  selectedId,
  onSelect,
  onBook
}: SessionStepProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const groupName = useId();
  const lenis = useLenis();
  const [shownId, setShownId] = useState(selectedId);
  useEntrance(rootRef, { stagger: 0.06 });

  // Fade the old details out, then swap them. Reduced motion swaps at once
  // (a zero-length tween completes immediately).
  useEffect(() => {
    if (selectedId === shownId) return;
    const detail = detailRef.current;
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const tween = gsap.to(detail, {
      autoAlpha: 0,
      y: 16,
      duration: reduced ? 0 : 0.3,
      ease: 'power2.in',
      onComplete: () => setShownId(selectedId)
    });
    return () => {
      tween.kill();
    };
  }, [selectedId, shownId]);

  // Once swapped, show the column again and bring its top into view if the
  // reader had scrolled down the previous session.
  useLayoutEffect(() => {
    const detail = detailRef.current;
    if (!detail) return;
    gsap.set(detail, { autoAlpha: 1, y: 0 });
    const top = detail.getBoundingClientRect().top;
    if (top < 0) {
      if (lenis) lenis.scrollTo(detail, { offset: -32 });
      else detail.scrollIntoView({ behavior: 'smooth' });
    }
    // Only a swap should scroll, not Lenis arriving.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownId]);

  const shown =
    services.find((service) => service.id === shownId) ?? services[0];

  return (
    <section ref={rootRef} className={styles.step}>
      <div className={styles.layout}>
        <p className={styles.railLabel} data-enter>
          {copy.label}
        </p>
        <div className={styles.rail}>
          <div
            className={styles.options}
            role="radiogroup"
            aria-label={copy.label}
          >
            {services.map((service) => (
              <SessionOption
                key={service.id}
                service={service}
                name={groupName}
                selected={service.id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </div>
          <div className={styles.action} data-enter>
            <SigilChip variant="solid" icon={<ArrowIcon />} onClick={onBook}>
              {copy.cta}
            </SigilChip>
            <p className={styles.hint}>{copy.hint}</p>
          </div>
        </div>

        <div ref={detailRef} className={styles.detailSlot}>
          <SessionDetail key={shown.id} copy={copy} service={shown} />
        </div>
      </div>
    </section>
  );
}
