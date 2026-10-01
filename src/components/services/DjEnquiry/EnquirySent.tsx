'use client';

import { useId, useRef, useState } from 'react';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { Rings } from '@/components/common/Rings';
import { SigilChip } from '@/components/common/SigilChip';
import { WordReveal } from '@/components/common/WordReveal';
import { ArrowIcon, SigilIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import { fill } from '@/lib/text/fill';
import styles from './DjEnquiry.module.scss';
import type { EnquirySentProps } from './DjEnquiry.types';

const MARK = '/img/brand/vortex.svg';
const MARK_VIEWBOX = '0 0 414.64 298.37';

// Figma "DJ · 2 · Sent": it's gone, and Candy will reach out. How to reach
// him meanwhile (his email and Discord copy on a click), the way on, and
// beside it a slip of what was sent: the event, the venue, the budget,
// what was said, and who from.
export default function EnquirySent({ copy, sent, contact }: EnquirySentProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const headingId = useId();
  const [copied, setCopied] = useState('');
  useEntrance(rootRef, { delay: 0.2, stagger: 0.09 });

  const rows = [
    { label: copy.slip.event, value: sent.eventName },
    { label: copy.slip.venue, value: sent.eventVenue },
    { label: copy.slip.budget, value: sent.budget }
  ].filter((row) => row.value !== '');
  const from = [fill(copy.slip.from, { name: sent.name }), sent.title]
    .filter(Boolean)
    .join(' · ');

  // The toast to come will say it; until then, assistive tech hears it.
  async function copyValue(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(fill(copy.copied, { value }));
    } catch {
      // No clipboard: the value is on screen to select.
    }
  }

  return (
    <section ref={rootRef} className={styles.sent} aria-labelledby={headingId}>
      <Rings className={styles.rings} />
      <div className={styles.sentLayout}>
        <div className={styles.sentMain}>
          <span className={styles.seal} data-enter aria-hidden="true">
            <SigilIcon />
          </span>
          <h2 id={headingId} className={styles.sentHeading}>
            <WordReveal text={copy.heading} trigger="mount" startDelay={0.3} />
          </h2>
          <WordReveal
            as="p"
            className={styles.sentBody}
            text={copy.body}
            trigger="mount"
            startDelay={0.6}
            staggerDelay={0.02}
          />
          <p className={styles.reach} data-enter>
            {copy.questions}{' '}
            <button
              type="button"
              className={styles.copy}
              onClick={() => void copyValue(contact.email)}
            >
              {contact.email}
            </button>
            <span aria-hidden="true"> · </span>
            {copy.discord}:{' '}
            <button
              type="button"
              className={styles.copy}
              onClick={() => void copyValue(contact.discord)}
            >
              {contact.discord}
            </button>
          </p>
          <p className={styles.srOnly} aria-live="polite">
            {copied}
          </p>
          <div className={styles.actions} data-enter>
            <SigilChip variant="outline" icon={<ArrowIcon />} href="/services">
              {copy.services}
            </SigilChip>
            <SigilChip variant="ghost" icon={null} href="/">
              {copy.home}
            </SigilChip>
          </div>
        </div>

        <aside
          className={styles.slip}
          aria-label={copy.slip.subject}
          data-enter
        >
          <div className={styles.slipHead}>
            <span className={styles.sentDot} aria-hidden="true" />
            <p className={styles.slipTo}>
              <span className={styles.srOnly}>{copy.slip.sent}</span>
              <span aria-hidden="true">
                <ClipRevealText
                  text={copy.slip.sent}
                  trigger="mount"
                  startDelay={0.8}
                  staggerDelay={0.015}
                />
              </span>
            </p>
          </div>
          <div className={styles.slipBody}>
            <svg
              className={styles.mark}
              viewBox={MARK_VIEWBOX}
              aria-hidden="true"
              focusable="false"
            >
              <use href={`${MARK}#mark`} />
            </svg>
            <p className={styles.subject}>{copy.slip.subject}</p>
            <p className={styles.slipText}>{sent.about}</p>
            {rows.length > 0 ? (
              <dl className={styles.slipRows}>
                {rows.map((row) => (
                  <div key={row.label} className={styles.slipRow}>
                    <dt className={styles.slipLabel}>{row.label}</dt>
                    <dd className={styles.slipValue}>{row.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <p className={styles.signature}>{from}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
