'use client';

import { useLenis } from 'lenis/react';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { SigilChip } from '@/components/common/SigilChip';
import { ArrowIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import { gsap } from '@/lib/animation/gsap';
import ItemDetail from './ItemDetail';
import ItemOption from './ItemOption';
import styles from './ItemStep.module.scss';
import type { ItemStepProps } from './ItemStep.types';

// Figma "Session details" / "Commission details": the items stay put in a
// sticky rail on the left, with the one action under them, while the
// chosen item's details scroll on the right. Picking another fades the
// details out and writes the new ones in. On a phone the rail becomes a
// swipeable row and the action sticks to the bottom of the screen.
export default function ItemStep({
  copy,
  items,
  selectedId,
  price,
  onSelect,
  onContinue
}: ItemStepProps) {
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
  // reader had scrolled down the previous item.
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

  const shown = items.find((item) => item.id === shownId) ?? items[0];

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
            {items.map((item) => (
              <ItemOption
                key={item.id}
                item={item}
                name={groupName}
                selected={item.id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </div>
          <div className={styles.action} data-enter>
            <SigilChip
              variant="solid"
              icon={<ArrowIcon />}
              onClick={onContinue}
            >
              {copy.cta}
            </SigilChip>
          </div>
        </div>

        <div ref={detailRef} className={styles.detailSlot}>
          <ItemDetail key={shown.id} copy={copy} item={shown} price={price} />
        </div>
      </div>
    </section>
  );
}
