'use client';

import { useId, useRef } from 'react';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { Rings } from '@/components/common/Rings';
import { SigilChip } from '@/components/common/SigilChip';
import { WordReveal } from '@/components/common/WordReveal';
import { ArrowIcon, ExternalIcon, SigilIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import {
  formatDayLong,
  formatDayShort,
  zonedTimeToUtc
} from '@/lib/booking/dates';
import { fill } from '@/lib/booking/format';
import { buildIcs, downloadIcs } from '@/lib/booking/ics';
import styles from './ConfirmedStep.module.scss';
import type { ConfirmedStepProps } from './ConfirmedStep.types';

const MARK = '/img/brand/vortex.svg';
const MARK_VIEWBOX = '0 0 414.64 298.37';

// Figma "D1 · 6 Confirmed": the booking, confirmed on screen, beside the
// email that just went out. "Add to calendar" hands over a real invite.
export default function ConfirmedStep({
  copy,
  service,
  confirmation,
  timeZone,
  timeZoneLabel,
  price
}: ConfirmedStepProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const headingId = useId();
  useEntrance(rootRef, { delay: 0.2, stagger: 0.09 });

  const { date, time, email } = confirmation;
  const when = `${formatDayShort(date)}, ${time} AT`;

  function addToCalendar() {
    const start = zonedTimeToUtc(date, time, timeZone);
    const end = new Date(start.getTime() + service.durationMinutes * 60000);
    downloadIcs(
      `candy-heist-${service.id}.ics`,
      buildIcs({
        uid: `${confirmation.reference}@candyheist.com`,
        start,
        end,
        title: `${service.name} with Candy Heist`,
        description: `${service.meta}. Booking ${confirmation.reference}.`
      })
    );
  }

  const facts = [
    { label: copy.session, value: service.name },
    { label: copy.when, value: when },
    { label: copy.paid, value: fill(copy.paidValue, { price }) }
  ];

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
            text={fill(copy.body, { email })}
            trigger="mount"
            startDelay={0.6}
            staggerDelay={0.02}
          />
          <dl className={styles.facts}>
            {facts.map((fact) => (
              <div key={fact.label} className={styles.fact} data-enter>
                <dt className={styles.factLabel}>{fact.label}</dt>
                <dd className={styles.factValue}>{fact.value}</dd>
              </div>
            ))}
          </dl>
          <div className={styles.actions} data-enter>
            <SigilChip
              variant="outline"
              icon={<ArrowIcon />}
              onClick={addToCalendar}
            >
              {copy.calendar}
            </SigilChip>
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
            <p className={styles.subject}>
              {fill(copy.email.subject, { service: service.name })}
            </p>
            <p className={styles.emailText}>
              {fill(copy.email.body, {
                date: formatDayLong(date),
                time: `${time}`,
                zone: timeZoneLabel
              })}
            </p>
            {/* A preview of the email's button, not a live link. */}
            <span className={styles.emailButton} aria-hidden="true">
              <span className={styles.emailButtonRing}>
                <ExternalIcon />
              </span>
              {copy.email.cta}
            </span>
            <p className={styles.signature}>{copy.email.signature}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
