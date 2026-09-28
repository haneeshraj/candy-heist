'use client';

import { useId, useRef } from 'react';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { ScrambleText } from '@/components/common/ScrambleText';
import { SigilChip } from '@/components/common/SigilChip';
import { WordReveal } from '@/components/common/WordReveal';
import { ArrowIcon, SigilIcon } from '@/components/icons';
import SessionsBackdrop from './SessionsBackdrop';
import SessionsList from './SessionsList';
import styles from './SessionsSection.module.scss';
import type {
  RegisterReveal,
  SessionsReveals,
  SessionsSectionProps
} from './SessionsSection.types';
import { useSessionsMotion } from './useSessionsMotion';

// "5E · Left column" from the Figma file: the stage photo fills the section
// and everything reads down one column over its dark side, from the
// headline to the last service. Motion lives in useSessionsMotion:
// scroll-scrubbed on desktop, on-view on mobile. Each animated text is
// paired with a plain copy for assistive tech.
export default function SessionsSection({ content }: SessionsSectionProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const reveals = useRef<SessionsReveals>({
    label: null,
    status: null,
    lead: null,
    statement: null,
    intro: null,
    names: [],
    summaries: []
  });
  const headingId = useId();
  useSessionsMotion(rootRef, reveals);

  const registerName: RegisterReveal = (index, reveal) => {
    reveals.current.names[index] = reveal;
  };
  const registerSummary: RegisterReveal = (index, reveal) => {
    reveals.current.summaries[index] = reveal;
  };

  const { headline } = content;

  return (
    <section
      ref={rootRef}
      id="sessions"
      className={styles.sessions}
      aria-labelledby={headingId}
    >
      <SessionsBackdrop photo={content.photo} />

      <div className={styles.inner}>
        <div className={styles.topline} data-motion="topline">
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

          <p className={styles.status}>
            <span
              className={styles.statusDot}
              data-motion="status-dot"
              aria-hidden="true"
            />
            <span className={styles.srOnly}>{content.status}</span>
            <span aria-hidden="true">
              <ClipRevealText
                ref={(handle) => {
                  reveals.current.status = handle;
                }}
                text={content.status}
                trigger="manual"
              />
            </span>
          </p>
        </div>

        <h2 id={headingId} className={styles.headline} data-motion="headline">
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

        <div className={styles.introWrap} data-motion="intro">
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

        {/* Motion wraps the chip so it never fights the magnetic pull. */}
        <span className={styles.ctaWrap} data-motion="cta">
          <SigilChip
            variant="solid"
            href={content.cta.href}
            icon={<ArrowIcon />}
          >
            {content.cta.label}
          </SigilChip>
        </span>

        <SessionsList
          services={content.services}
          registerName={registerName}
          registerSummary={registerSummary}
        />
      </div>
    </section>
  );
}
