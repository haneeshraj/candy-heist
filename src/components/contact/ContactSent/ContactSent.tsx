'use client';

import { useEffect, useId, useRef } from 'react';
import { ScrambleText } from '@/components/common/ScrambleText';
import { SigilChip } from '@/components/common/SigilChip';
import { WordReveal } from '@/components/common/WordReveal';
import { ArrowIcon, SigilIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import styles from './ContactSent.module.scss';
import type { ContactSentProps } from './ContactSent.types';

const RINGS = 4;

// Where the form was: the signal going out from the crimson source, and who
// the reply goes to. The heading takes focus so the change is announced and
// scrolled to; everything rises in as it arrives.
export default function ContactSent({
  copy,
  sent,
  phone,
  onAgain
}: ContactSentProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const headingId = useId();
  useEntrance(rootRef, { delay: 0.15 });

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const lead = copy.lead.replace('{name}', sent.name.split(/\s+/)[0]);
  const body = copy.body
    .replace('{email}', sent.email)
    .replace('{phone}', phone.label);

  return (
    <section ref={rootRef} className={styles.sent} aria-labelledby={headingId}>
      <div className={styles.signal} aria-hidden="true">
        {Array.from({ length: RINGS }, (_, i) => (
          <span key={i} className={styles.ring} />
        ))}
        <span className={styles.halo} />
        <span className={styles.source} />
      </div>

      <p className={styles.label} data-enter>
        <span className={styles.labelSigil}>
          <SigilIcon />
        </span>
        {copy.label}
      </p>

      <h2
        ref={headingRef}
        id={headingId}
        className={styles.headline}
        tabIndex={-1}
      >
        <span className={styles.srOnly}>
          {lead} {copy.statement}
        </span>
        <span className={styles.headlineVisual} aria-hidden="true">
          <WordReveal
            className={styles.lead}
            text={lead}
            trigger="mount"
            startDelay={0.3}
            staggerDelay={0.08}
          />
          <ScrambleText
            className={styles.statement}
            text={copy.statement}
            trigger="mount"
            startDelay={0.55}
            scrambleEnabled={false}
          />
        </span>
      </h2>

      <p className={styles.body} data-enter>
        {body}
      </p>

      <div className={styles.actions} data-enter>
        <SigilChip variant="ghost" icon={null} onClick={onAgain}>
          {copy.again}
        </SigilChip>
        <SigilChip href={copy.home.href} icon={<ArrowIcon />}>
          {copy.home.label}
        </SigilChip>
      </div>
    </section>
  );
}
