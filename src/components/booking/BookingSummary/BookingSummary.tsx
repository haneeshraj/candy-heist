'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { Frame } from '@/components/common/Frame';
import { ScrambleText } from '@/components/common/ScrambleText';
import { WordReveal } from '@/components/common/WordReveal';
import { useEntrance } from '@/hooks/useEntrance';
import { formatDayMedium } from '@/lib/booking/dates';
import styles from './BookingSummary.module.scss';
import type { BookingSummaryProps } from './BookingSummary.types';

const CAPITALS = { range: [65, 90] as [number, number] };

// Keyed by its value, so each change replays the reveal.
function Value({ value }: { value: string }) {
  return <WordReveal key={value} text={value} trigger="mount" />;
}

// The running summary beside the date, details and payment steps (Figma
// "Booking / Summary"): the session's photo, then each choice as it's made.
export default function BookingSummary({
  copy,
  service,
  date,
  time,
  timeZoneLabel,
  price
}: BookingSummaryProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  useEntrance(rootRef, { delay: 0.2 });
  const length = service.facts[0]?.value ?? copy.empty;

  const rows = [
    { label: copy.date, value: date ? formatDayMedium(date) : copy.empty },
    { label: copy.time, value: time ? `${time} ${timeZoneLabel}` : copy.empty },
    { label: copy.length, value: length }
  ];

  return (
    <aside ref={rootRef} className={styles.summary} aria-label={copy.label}>
      <div className={styles.photo} data-enter>
        <Frame travel={40}>
          <Image
            src={service.photos.wide}
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
          <span className={styles.srOnly}>{service.name}</span>
          <span aria-hidden="true">
            <ScrambleText
              key={service.id}
              text={service.name}
              trigger="mount"
              staggerDelay={0.03}
              letterDuration={0.7}
              scramble={CAPITALS}
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
          <span className={styles.rowLabel}>{copy.advance}</span>
          <span className={styles.price}>{price}</span>
        </div>
      </div>
    </aside>
  );
}
