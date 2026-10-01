'use client';

import Image from 'next/image';
import { useId, useRef } from 'react';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { CornerTicks } from '@/components/common/CornerTicks';
import { Frame } from '@/components/common/Frame';
import { useEntrance } from '@/hooks/useEntrance';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import ItemBody from './ItemBody';
import styles from './ItemStep.module.scss';
import type { ItemDetailProps } from './ItemStep.types';

// Everything about one item. It's mounted fresh for each one, so the top
// (the photo, the title, the first paragraph) writes itself in straight
// away, and the rest of the write-up rises in as it scrolls into view.
// The facts (length or format, how it happens, the price) close it.
export default function ItemDetail({ copy, item, price }: ItemDetailProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  useEntrance(rootRef, { stagger: 0.08 });
  useScrollReveal(rootRef);

  const facts = [
    ...item.facts,
    { label: copy.price, value: item.price ?? price }
  ];

  return (
    <article ref={rootRef} className={styles.detail} aria-labelledby={titleId}>
      <div className={styles.photo} data-enter>
        <Frame travel={80}>
          <Image
            src={item.photos.wide}
            alt={item.photos.alt}
            fill
            sizes="(min-width: 1024px) 800px, 100vw"
            className={styles.photoImage}
          />
        </Frame>
        <CornerTicks />
      </div>

      <h2 id={titleId} className={styles.title}>
        <span className={styles.srOnly}>{item.name}</span>
        <span aria-hidden="true">
          <ClipRevealText
            text={item.name}
            trigger="mount"
            startDelay={0.25}
            staggerDelay={0.035}
          />
        </span>
      </h2>

      <ItemBody blocks={item.blocks} />

      <dl className={styles.facts} data-reveal>
        {facts.map((fact) => (
          <div key={fact.label} className={styles.fact}>
            <dt className={styles.factLabel}>{fact.label}</dt>
            <dd className={styles.factValue}>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
