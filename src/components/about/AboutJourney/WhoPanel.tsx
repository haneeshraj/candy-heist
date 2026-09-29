'use client';

import { useId } from 'react';
import { RichWordReveal } from '@/components/common/RichWordReveal';
import { SocialLinks } from '@/components/common/SocialLinks';
import { WordReveal } from '@/components/common/WordReveal';
import type { AboutCopy } from '@/content/about/about';
import type { SocialLink } from '@/content/site/socials';
import { AboutLabel } from '../AboutLabel';
import type { RevealBinder } from '../reveals';
import FlowReadouts from './FlowReadouts';
import OrbFigure from './OrbFigure';
import styles from './AboutJourney.module.scss';

interface WhoPanelProps {
  copy: AboutCopy['who'];
  streaming: SocialLink[];
  bind: RevealBinder;
}

// Frame 2: who he is, beside the orb, which has moved left with his photo
// in it and the lock on its crown. Ends on his streaming profiles.
export default function WhoPanel({ copy, streaming, bind }: WhoPanelProps) {
  const headingId = useId();

  return (
    <section
      className={`${styles.panel} ${styles.who}`}
      data-motion="panel-who"
      aria-labelledby={headingId}
    >
      <OrbFigure mode="photo" photo={copy.photo} />
      <FlowReadouts readouts={copy.readouts} />

      <div className={styles.column}>
        <AboutLabel
          as="h2"
          id={headingId}
          text={copy.label}
          revealKey="who.label"
          bind={bind}
        />
        <RichWordReveal
          ref={bind('who.body')}
          segments={copy.body}
          className={styles.whoBody}
          emphasisClassName={styles.emphasis}
          placeholderClassName={styles.placeholder}
          staggerDelay={0.02}
        />
        <WordReveal
          ref={bind('who.secondary')}
          as="p"
          className={styles.whoSecondary}
          text={copy.secondary}
          trigger="manual"
          staggerDelay={0.015}
        />
        <SocialLinks
          links={streaming}
          label={copy.streamingLabel}
          className={styles.socials}
          itemMotion="social"
        />
      </div>
    </section>
  );
}
