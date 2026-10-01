'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { Frame } from '@/components/common/Frame';
import { WordReveal } from '@/components/common/WordReveal';
import { useEntrance } from '@/hooks/useEntrance';
import styles from './BookingSummary.module.scss';
import type { BookingSummaryProps } from './BookingSummary.types';

// Keyed by its value, so each change replays the reveal.
function Value({ value }: { value: string }) {
  return <WordReveal key={value} text={value} trigger="mount" />;
}

// The running summary beside the date, details and payment steps (Figma
// "Booking / Summary"): the item's photo, its name, then each choice as
// it's made, and what's paid.
export default function BookingSummary({
  copy,
  item,
  rows,
  price
}: BookingSummaryProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  useEntrance(rootRef, { delay: 0.2 });

  return (
    <aside ref={rootRef} className={styles.summary} aria-label={copy.label}>
      <div className={styles.photo} data-enter>
        <Frame travel={40}>
          <Image
            src={item.photos.wide}
            alt=""
            fill
            sizes="(min-width: 1024px) 380px, 100vw"
            className={styles.photoImage}
          />
        </Frame>
      </div>
      <div className={styles.body}>
        <p className={styles.eyebrow} data-enter>
          {copy.label}
        </p>
        <p className={styles.name} data-enter>
          <span className={styles.srOnly}>{item.name}</span>
          <span aria-hidden="true">
            <ClipRevealText
              key={item.id}
              text={item.name}
              trigger="mount"
              staggerDelay={0.03}
            />
          </span>
        </p>
        <dl className={styles.rows}>
          {rows.map((row) => (
            <div key={row.label} className={styles.row} data-enter>
              <dt className={styles.rowLabel}>{row.label}</dt>
              <dd className={styles.rowValue}>
                <Value value={row.value} />
              </dd>
            </div>
          ))}
        </dl>
        <span className={styles.rule} data-enter aria-hidden="true" />
        <div className={styles.advance} data-enter>
          <span className={styles.rowLabel}>{copy.total}</span>
          <span className={styles.price}>{price}</span>
        </div>
      </div>
    </aside>
  );
}
