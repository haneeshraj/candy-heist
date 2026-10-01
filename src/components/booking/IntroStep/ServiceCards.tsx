'use client';

import { useRef } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { amountsFor } from '@/lib/booking/price';
import { itemHref } from '../BookingFlow/useBookingFlow';
import ItemCard from './ItemCard';
import styles from './IntroStep.module.scss';
import type { ServiceCardsProps } from './IntroStep.types';

// The services found, as cards. Its own reveal root, mounted afresh for
// each new set (the intro keys it by the results), so the cards a search
// or a filter finds come in the way the first ones did.
export default function ServiceCards({
  items,
  kinds,
  price,
  view,
  onOpen
}: ServiceCardsProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  useScrollReveal(rootRef);

  return (
    <div
      ref={rootRef}
      className={styles.cards}
      data-few={items.length <= 2 ? 'true' : undefined}
    >
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          href={itemHref(item.id)}
          tag={kinds[item.kind].tag}
          price={amountsFor(item.kind, item.price, price).price}
          view={view}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
