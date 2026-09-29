'use client';

import { MotionConfig } from 'motion/react';
import { useId, useRef, useState } from 'react';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { ScrambleText } from '@/components/common/ScrambleText';
import { SigilChip } from '@/components/common/SigilChip';
import { WordReveal } from '@/components/common/WordReveal';
import { ArrowIcon, SigilIcon } from '@/components/icons';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { DESKTOP_QUERY } from '@/lib/constants/breakpoints';
import { DESKTOP_SHELF, MOBILE_SHELF } from '@/lib/shelf/shelf';
import styles from './DiscographySection.module.scss';
import type { DiscographySectionProps } from './DiscographySection.types';
import ShelfMonument from './ShelfMonument';
import ShelfRelease from './ShelfRelease';
import TapeShelf from './TapeShelf';

// Figma "Discography v3 — Tape v2 (Option A)": the archive as a shelf of
// cassettes running on its own, the lifted tape's title monumental behind
// it. Headline top left, the lifted release top right, the way to the full
// discography bottom right. Everything arrives as the section comes into
// view: the text writes itself in, the tapes slide into the row front to
// back, then the row starts to run.
export default function DiscographySection({
  content
}: DiscographySectionProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const headingId = useId();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const reducedMotion = useReducedMotion();
  const [focus, setFocus] = useState(0);
  useScrollReveal(rootRef);

  const { headline, releases } = content;
  const release = releases[focus] ?? releases[0];

  return (
    <MotionConfig reducedMotion="user">
      <section
        ref={rootRef}
        id="discography"
        className={styles.discography}
        aria-labelledby={headingId}
      >
        <div className={styles.inner}>
          <div className={styles.head}>
            <p className={styles.label}>
              <span className={styles.labelSigil}>
                <SigilIcon />
              </span>
              <span className={styles.srOnly}>{content.label}</span>
              <span aria-hidden="true">
                <ClipRevealText
                  text={content.label}
                  trigger="inView"
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
                  className={styles.lead}
                  text={headline.lead}
                  trigger="inView"
                  startDelay={0.15}
                  staggerDelay={0.08}
                />
                <ScrambleText
                  className={styles.statement}
                  text={headline.statement}
                  trigger="inView"
                  startDelay={0.4}
                  scrambleEnabled={false}
                />
              </span>
            </h2>

            <WordReveal
              as="p"
              className={styles.intro}
              text={content.intro}
              trigger="inView"
              startDelay={0.8}
              staggerDelay={0.02}
            />
          </div>

          <ShelfRelease release={release} />

          <TapeShelf
            releases={releases}
            label={content.shelfLabel}
            layout={isDesktop ? DESKTOP_SHELF : MOBILE_SHELF}
            interactive={isDesktop}
            reducedMotion={reducedMotion}
            onFocus={setFocus}
          >
            <ShelfMonument title={release.title} />
          </TapeShelf>

          {/* Motion wraps the chip so it never fights the magnetic pull. */}
          <span className={styles.cta} data-reveal>
            <SigilChip href={content.cta.href} icon={<ArrowIcon />}>
              {content.cta.label}
            </SigilChip>
          </span>
        </div>
      </section>
    </MotionConfig>
  );
}
