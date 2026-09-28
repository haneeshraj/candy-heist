'use client';

import { useId, useRef } from 'react';
import { SigilChip } from '@/components/common/SigilChip';
import { SigilIcon } from '@/components/icons';
import AboutArch from './AboutArch';
import AboutBackdrop from './AboutBackdrop';
import AboutFacts from './AboutFacts';
import AboutHeadline from './AboutHeadline';
import styles from './AboutSection.module.scss';
import type { AboutSectionProps } from './AboutSection.types';
import { useAboutMotion } from './useAboutMotion';

// "Nave v3" from the Figma file: an arched photo as the monument, the
// thesis split across it, four facts, then the interpretation below the
// floor line. Motion lives in useAboutMotion: scroll-scrubbed on desktop,
// on-view on mobile.
export default function AboutSection({ content }: AboutSectionProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const headingId = useId();
  useAboutMotion(rootRef);

  const { headline } = content;
  const thesis = `${headline.left.lead} ${headline.left.statement} ${headline.right.lead} ${headline.right.statement}`;

  return (
    <section
      ref={rootRef}
      id="about"
      className={styles.about}
      aria-labelledby={headingId}
    >
      <AboutBackdrop />

      <div className={styles.inner}>
        <p className={styles.label} data-motion="label">
          <span className={styles.labelSigil} data-motion="label-sigil">
            <SigilIcon />
          </span>
          {content.label}
        </p>

        <span
          className={styles.hairline}
          data-motion="line"
          aria-hidden="true"
        />
        <span className={styles.orb} aria-hidden="true">
          <span className={styles.orbHalo} data-motion="halo" />
          <span className={styles.orbCore} data-motion="orb" />
        </span>

        <h2 id={headingId} className={styles.srOnly}>
          {thesis}
        </h2>

        <div className={styles.stage} data-motion="stage">
          <div className={`${styles.side} ${styles.sideLeft}`}>
            <AboutHeadline half={headline.left} side="left" />
            <AboutFacts facts={content.facts.left} side="left" />
          </div>

          <AboutArch photo={content.photo} />

          <div className={`${styles.side} ${styles.sideRight}`}>
            <AboutHeadline half={headline.right} side="right" />
            <AboutFacts facts={content.facts.right} side="right" />
          </div>
        </div>

        <span
          className={styles.divider}
          data-motion="divider"
          aria-hidden="true"
        />

        <div className={styles.copy} data-motion="copy">
          <p className={styles.body} data-motion="body">
            {content.body.map((segment, i) =>
              segment.emphasis ? (
                <em key={i} className={styles.emphasis}>
                  {segment.text}
                </em>
              ) : (
                segment.text
              )
            )}
          </p>
          <div className={styles.asideColumn}>
            <p className={styles.aside} data-motion="aside">
              {content.aside}
            </p>
            {/* Motion wraps the chip so it never fights the magnetic pull. */}
            <span className={styles.ctaWrap} data-motion="cta">
              <SigilChip
                variant="ghost"
                size={{ base: 'md', desktop: 'sm' }}
                href={content.cta.href}
              >
                {content.cta.label}
              </SigilChip>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
