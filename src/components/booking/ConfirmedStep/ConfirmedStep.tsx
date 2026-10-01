'use client';

import { useId, useRef, useState } from 'react';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { Rings } from '@/components/common/Rings';
import { SigilChip } from '@/components/common/SigilChip';
import { WordReveal } from '@/components/common/WordReveal';
import { ArrowIcon, ExternalIcon, SigilIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import { formatDayLong, zonedTimeToUtc } from '@/lib/booking/dates';
import { fill } from '@/lib/booking/format';
import { buildIcs, downloadIcs } from '@/lib/booking/ics';
import styles from './ConfirmedStep.module.scss';
import type { ConfirmedStepProps } from './ConfirmedStep.types';

const MARK = '/img/brand/vortex.svg';
const MARK_VIEWBOX = '0 0 414.64 298.37';

// Figma "Confirmed": done, on screen, beside the email that just went out.
// The page says what happens next and how to reach Candy (his email and
// his Discord copy on a click), with the way on; the email carries the
// receipt and, for a session, the call link. Each fact is said once.
export default function ConfirmedStep({
  kind,
  copy,
  item,
  confirmation,
  timeZone,
  price,
  contact
}: ConfirmedStepProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const headingId = useId();
  const [copied, setCopied] = useState('');
  useEntrance(rootRef, { delay: 0.2, stagger: 0.09 });

  const { date, time, email, meetOn, reference } = confirmation;
  const session = kind === 'session' && date && time;
  const onDiscord = meetOn === 'discord';

  const body =
    onDiscord && copy.bodyDiscord
      ? copy.bodyDiscord
      : fill(copy.body, { email });
  const emailBody = fill(
    onDiscord && copy.email.bodyDiscord
      ? copy.email.bodyDiscord
      : copy.email.body,
    session ? { date: formatDayLong(date), time } : {}
  );
  const emailCta =
    onDiscord && copy.email.ctaDiscord ? copy.email.ctaDiscord : copy.email.cta;

  const receipt = [
    { label: copy.receipt.item, value: item.name },
    { label: copy.receipt.reference, value: reference },
    { label: copy.receipt.paid, value: fill(copy.receipt.paidValue, { price }) }
  ];

  function addToCalendar() {
    if (!session) return;
    const start = zonedTimeToUtc(date, time, timeZone);
    const end = new Date(
      start.getTime() + (item.durationMinutes ?? 60) * 60000
    );
    downloadIcs(
      `candy-heist-${item.id}.ics`,
      buildIcs({
        uid: `${reference}@candyheist.com`,
        start,
        end,
        title: `${item.name} with Candy Heist`,
        description: `${item.name}. Booking ${reference}.`
      })
    );
  }

  // The toast to come will say it; until then, assistive tech hears it.
  async function copyValue(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(fill(copy.copied, { value }));
    } catch {
      // No clipboard (an old browser, a blocked permission): the value is
      // on screen to select.
    }
  }

  return (
    <section
      ref={rootRef}
      className={styles.confirmed}
      aria-labelledby={headingId}
    >
      <Rings className={styles.rings} />
      <div className={styles.layout}>
        <div className={styles.main}>
          <span className={styles.seal} data-enter aria-hidden="true">
            <SigilIcon />
          </span>
          <h2 id={headingId} className={styles.heading}>
            <WordReveal text={copy.heading} trigger="mount" startDelay={0.3} />
          </h2>
          <WordReveal
            as="p"
            className={styles.body}
            text={body}
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
            {session && copy.calendar ? (
              <SigilChip
                variant="outline"
                icon={<ArrowIcon />}
                onClick={addToCalendar}
              >
                {copy.calendar}
              </SigilChip>
            ) : null}
            {copy.services ? (
              <SigilChip
                variant="outline"
                icon={<ArrowIcon />}
                href="/services"
              >
                {copy.services}
              </SigilChip>
            ) : null}
            <SigilChip variant="ghost" icon={null} href="/">
              {copy.home}
            </SigilChip>
          </div>
        </div>

        <aside className={styles.email} aria-label={copy.email.sent} data-enter>
          <div className={styles.emailHead}>
            <span className={styles.sentDot} aria-hidden="true" />
            <p className={styles.emailTo}>
              <span className={styles.srOnly}>
                {copy.email.sent} · {email}
              </span>
              <span aria-hidden="true">
                <ClipRevealText
                  text={`${copy.email.sent} · ${email}`}
                  trigger="mount"
                  startDelay={0.8}
                  staggerDelay={0.015}
                />
              </span>
            </p>
          </div>
          <div className={styles.emailBody}>
            <svg
              className={styles.mark}
              viewBox={MARK_VIEWBOX}
              aria-hidden="true"
              focusable="false"
            >
              <use href={`${MARK}#mark`} />
            </svg>
            <p className={styles.subject}>{copy.email.subject}</p>
            <p className={styles.emailText}>{emailBody}</p>
            <dl className={styles.receipt}>
              {receipt.map((row) => (
                <div key={row.label} className={styles.receiptRow}>
                  <dt className={styles.receiptLabel}>{row.label}</dt>
                  <dd className={styles.receiptValue}>{row.value}</dd>
                </div>
              ))}
            </dl>
            {session && emailCta ? (
              // A preview of the email's button, not a live link.
              <span className={styles.emailButton} aria-hidden="true">
                <span className={styles.emailButtonRing}>
                  <ExternalIcon />
                </span>
                {emailCta}
              </span>
            ) : null}
            <p className={styles.signature}>{copy.email.signature}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
