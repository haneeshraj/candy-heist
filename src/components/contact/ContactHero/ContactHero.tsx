'use client';

import { useRef } from 'react';
import { Broadcast } from '@/components/common/Broadcast';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { ScrambleText } from '@/components/common/ScrambleText';
import { WordReveal } from '@/components/common/WordReveal';
import { SigilIcon } from '@/components/icons';
import styles from './ContactHero.module.scss';
import type { ContactHeroProps } from './ContactHero.types';
import { useSignalReveal } from './useSignalReveal';

// Figma "Contact page form": the home Contact section carried on, its rings
// rising from the horizon behind a centred heading, with the form starting
// under the horizon. The text writes itself in and the rings ripple out
// once, on view. Each animated text is paired with a plain copy for
// assistive tech.
export default function ContactHero({
  headingId,
  label,
  headline,
  intro
}: ContactHeroProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  useSignalReveal(rootRef);

  return (
    <header ref={rootRef} className={styles.hero}>
      <Broadcast className={styles.broadcast} pulses={1} />

      <div className={styles.inner}>
        <p className={styles.label}>
          <span className={styles.labelSigil} data-motion="label-sigil">
            <SigilIcon />
          </span>
          <span className={styles.srOnly}>{label}</span>
          <span aria-hidden="true">
            <ClipRevealText
              text={label}
              trigger="inView"
              wipeColor="var(--color-gilt)"
            />
          </span>
        </p>

        <h1 id={headingId} className={styles.headline}>
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
        </h1>

        <WordReveal
          as="p"
          className={styles.intro}
          text={intro}
          trigger="inView"
          startDelay={0.8}
          staggerDelay={0.02}
        />
      </div>
    </header>
  );
}
