'use client';

import { useId, useRef } from 'react';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { WordReveal } from '@/components/common/WordReveal';
import { SigilIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import ServiceDoor from './ServiceDoor';
import styles from './ServicesPage.module.scss';
import type { ServicesPageProps } from './ServicesPage.types';
import { useServicesMotion } from './useServicesMotion';

// The services page (Figma "Three doors v2"): a centred headline, a door
// to each kind of service (commissions, sessions, and sounds and presets,
// sealed until they're out), then how it works. The items themselves are
// chosen on each kind's own page.
export default function ServicesPage({ content }: ServicesPageProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const headingId = useId();
  useEntrance(rootRef, { delay: 0.1 });
  useServicesMotion(rootRef);

  return (
    <section
      ref={rootRef}
      className={styles.services}
      aria-labelledby={headingId}
    >
      <header className={styles.head}>
        <p className={styles.label}>
          <span className={styles.labelSigil} data-enter aria-hidden="true">
            <SigilIcon />
          </span>
          <span className={styles.srOnly}>{content.label}</span>
          <span aria-hidden="true">
            <ClipRevealText
              text={content.label}
              trigger="mount"
              wipeColor="var(--color-gilt)"
            />
          </span>
        </p>
        <h1 id={headingId} className={styles.headline}>
          <span className={styles.srOnly}>
            {content.lead} {content.statement}
          </span>
          <span className={styles.headlineVisual} aria-hidden="true">
            <WordReveal
              className={styles.lead}
              text={content.lead}
              trigger="mount"
              startDelay={0.15}
              staggerDelay={0.08}
            />
            <ClipRevealText
              className={styles.statement}
              text={content.statement}
              trigger="mount"
              startDelay={0.45}
            />
          </span>
        </h1>
        <WordReveal
          as="p"
          className={styles.intro}
          text={content.intro}
          trigger="mount"
          startDelay={0.8}
          staggerDelay={0.02}
        />
      </header>

      <div className={styles.doors}>
        {content.doors.map((door, index) => (
          <ServiceDoor key={door.kicker} door={door} index={index} />
        ))}
      </div>

      <section
        className={styles.how}
        data-motion="how"
        aria-label={content.how.label}
      >
        <span
          className={styles.howRule}
          data-motion="how-rule"
          aria-hidden="true"
        />
        <p className={styles.howLabel} data-motion="how-label">
          {content.how.label}
        </p>
        <ol className={styles.howSteps}>
          {content.how.steps.map((step) => (
            <li
              key={step.title}
              className={styles.howStep}
              data-motion="how-step"
            >
              <span className={styles.howMark} aria-hidden="true" />
              <span className={styles.howTitle}>{step.title}</span>
              <span className={styles.howText}>{step.text}</span>
            </li>
          ))}
        </ol>
      </section>
    </section>
  );
}
