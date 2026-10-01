'use client';

import { useLenis } from 'lenis/react';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { SigilChip } from '@/components/common/SigilChip';
import { SERVICE_KINDS } from '@/content/services/catalogue';
import { ArrowIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import { gsap } from '@/lib/animation/gsap';
import ItemDetail from './ItemDetail';
import ItemOption from './ItemOption';
import styles from './ItemStep.module.scss';
import type { ItemStepProps } from './ItemStep.types';

// Figma "Producer · 2 · Item": every service in a sticky rail on the
// left, the commissions and the 1-1 sessions each under their own label,
// with the one action under them, while the chosen item's details scroll
// on the right. Picking another fades the details out and writes the new
// ones in. On a phone the rail becomes a swipeable row and the action
// sticks to the bottom of the screen.
export default function ItemStep({
  copy,
  kinds,
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
  const selectedKind =
    items.find((item) => item.id === selectedId)?.kind ?? shown.kind;
  const groups = SERVICE_KINDS.map((kind) => ({
    kind,
    items: items.filter((item) => item.kind === kind)
  })).filter((group) => group.items.length > 0);

  return (
    <section ref={rootRef} className={styles.step}>
      <div className={styles.layout}>
        <div className={styles.rail}>
          {/* One name across the groups, so the arrow keys run through all
              of them. A long list scrolls on its own, past Lenis. */}
          <div
            className={styles.options}
            aria-label={copy.label}
            role="group"
            data-lenis-prevent
          >
            {groups.map((group) => (
              <div
                key={group.kind}
                className={styles.group}
                role="radiogroup"
                aria-labelledby={`${groupName}-${group.kind}`}
              >
                <p
                  id={`${groupName}-${group.kind}`}
                  className={styles.groupLabel}
                  data-enter
                >
                  {kinds[group.kind].group}
                </p>
                {group.items.map((item) => (
                  <ItemOption
                    key={item.id}
                    item={item}
                    name={groupName}
                    selected={item.id === selectedId}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className={styles.action} data-enter>
            <SigilChip
              variant="solid"
              icon={<ArrowIcon />}
              onClick={onContinue}
            >
              {kinds[selectedKind].item.cta}
            </SigilChip>
          </div>
        </div>

        <div ref={detailRef} className={styles.detailSlot}>
          <ItemDetail
            key={shown.id}
            copy={copy}
            kind={kinds[shown.kind]}
            item={shown}
            price={price}
          />
        </div>
      </div>
    </section>
  );
}
