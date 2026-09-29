'use client';

import { ClipRevealText } from '@/components/common/ClipRevealText';
import { WordReveal } from '@/components/common/WordReveal';
import type { AboutCopy } from '@/content/about/about';
import OrbFigure from './OrbFigure';
import styles from './AboutJourney.module.scss';

interface IntroPanelProps {
  copy: AboutCopy['intro'];
  headingId: string;
}

// Frame 1: the orb centred with the logo in it, the heading under it. The
// first screen, so its words write themselves in as the page opens.
export default function IntroPanel({ copy, headingId }: IntroPanelProps) {
  return (
    <header
      className={`${styles.panel} ${styles.intro}`}
      data-motion="panel-intro"
    >
      <OrbFigure mode="logo" />

      <h1 id={headingId} className={styles.introHeading}>
        <span className={styles.srOnly}>
          {copy.lead} {copy.statement}
        </span>
        <span className={styles.introVisual} aria-hidden="true">
          <WordReveal
            className={styles.introLead}
            text={copy.lead}
            trigger="mount"
            startDelay={0.35}
            staggerDelay={0.08}
          />
          <ClipRevealText
            className={styles.introStatement}
            text={copy.statement}
            trigger="mount"
            startDelay={0.6}
          />
        </span>
      </h1>

      <WordReveal
        as="p"
        className={styles.introSub}
        text={copy.sub}
        trigger="mount"
        startDelay={1}
        staggerDelay={0.02}
      />

      <p className={styles.cue} data-motion="cue" aria-hidden="true">
        {copy.cue}
        <span className={styles.cueLine} />
      </p>
    </header>
  );
}
