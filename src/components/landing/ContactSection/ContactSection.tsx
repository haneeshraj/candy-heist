'use client';

import { useId, useRef } from 'react';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { ScrambleText } from '@/components/common/ScrambleText';
import { SigilChip } from '@/components/common/SigilChip';
import { WordReveal } from '@/components/common/WordReveal';
import { ArrowIcon, MailIcon, PhoneIcon, SigilIcon } from '@/components/icons';
import ContactBackdrop from './ContactBackdrop';
import styles from './ContactSection.module.scss';
import type {
  ContactReveals,
  ContactSectionProps
} from './ContactSection.types';
import { useContactMotion } from './useContactMotion';

// "V · Broadcast" from the Figma file: signal rings rise from a crimson
// source on the horizon, the copy is centred above them with the two ways
// to reach out under it, and the one main action sits in the bottom-right
// corner. Motion lives in useContactMotion: scroll-scrubbed on desktop,
// on-view on mobile. Each animated text is paired with a plain copy for
// assistive tech.
export default function ContactSection({ content }: ContactSectionProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const reveals = useRef<ContactReveals>({
    label: null,
    lead: null,
    statement: null,
    intro: null
  });
  const headingId = useId();
  useContactMotion(rootRef, reveals);

  const { headline, phone } = content;

  return (
    <section
      ref={rootRef}
      id="contact"
      className={styles.contact}
      aria-labelledby={headingId}
    >
      <ContactBackdrop />

      <div className={styles.inner}>
        <div className={styles.head} data-motion="head">
          <p className={styles.label}>
            <span className={styles.labelSigil} data-motion="label-sigil">
              <SigilIcon />
            </span>
            <span className={styles.srOnly}>{content.label}</span>
            <span aria-hidden="true">
              <ClipRevealText
                ref={(handle) => {
                  reveals.current.label = handle;
                }}
                text={content.label}
                trigger="manual"
                wipeColor="var(--color-gilt)"
              />
            </span>
          </p>

          <h2 id={headingId} className={styles.headline}>
            <span className={styles.srOnly}>
              {headline.lead} {headline.statement}
            </span>
            <span className={styles.headlineVisual} aria-hidden="true">
              <WordReveal
                ref={(handle) => {
                  reveals.current.lead = handle;
                }}
                className={styles.lead}
                text={headline.lead}
                trigger="manual"
                staggerDelay={0.08}
              />
              <ScrambleText
                ref={(handle) => {
                  reveals.current.statement = handle;
                }}
                className={styles.statement}
                text={headline.statement}
                trigger="manual"
                scrambleEnabled={false}
              />
            </span>
          </h2>

          <WordReveal
            ref={(handle) => {
              reveals.current.intro = handle;
            }}
            as="p"
            className={styles.intro}
            text={content.intro}
            trigger="manual"
          />
        </div>

        {/* Motion wraps each chip so it never fights the magnetic pull. */}
        <ul className={styles.channels} data-motion="channels">
          <li className={styles.channel} data-motion="channel">
            <SigilChip
              href={`mailto:${content.email}`}
              icon={<MailIcon />}
              uppercase={false}
            >
              {content.email}
            </SigilChip>
          </li>
          <li className={styles.channel} data-motion="channel">
            <SigilChip href={phone.href} icon={<PhoneIcon />}>
              {phone.label}
            </SigilChip>
          </li>
        </ul>

        <span className={styles.cta} data-motion="cta">
          <SigilChip
            variant="solid"
            href={content.cta.href}
            icon={<ArrowIcon />}
          >
            {content.cta.label}
          </SigilChip>
        </span>
      </div>
    </section>
  );
}
