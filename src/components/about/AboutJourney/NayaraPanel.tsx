'use client';

import { useId } from 'react';
import { ClipRevealText } from '@/components/common/ClipRevealText';
import { SigilChip } from '@/components/common/SigilChip';
import { WordReveal } from '@/components/common/WordReveal';
import type { AboutCopy } from '@/content/about/about';
import { AboutLabel } from '../AboutLabel';
import type { RevealBinder } from '../reveals';
import FlowReadouts from './FlowReadouts';
import OrbFigure from './OrbFigure';
import styles from './AboutJourney.module.scss';

interface NayaraPanelProps {
  copy: AboutCopy['nayara'];
  bind: RevealBinder;
}

// Frame 3: the world of Nayara. His photo sinks into the planet and the
// readouts turn from the real places into the fictional ones; the button
// goes to the lore, told in chapters on its own page.
export default function NayaraPanel({ copy, bind }: NayaraPanelProps) {
  const headingId = useId();

  return (
    <section
      className={`${styles.panel} ${styles.nayara}`}
      data-motion="panel-nayara"
      aria-labelledby={headingId}
    >
      <OrbFigure mode="planet" />
      <FlowReadouts readouts={copy.readouts} />

      <div className={styles.column}>
        <AboutLabel text={copy.label} revealKey="nayara.label" bind={bind} />
        <h2 id={headingId} className={styles.nayaraHeading}>
          <span className={styles.srOnly}>
            {copy.lead} {copy.statement.replace(/\n/g, ' ')}
          </span>
          <span className={styles.nayaraVisual} aria-hidden="true">
            <WordReveal
              ref={bind('nayara.lead')}
              className={styles.nayaraLead}
              text={copy.lead}
              trigger="manual"
              staggerDelay={0.08}
            />
            {copy.statement.split('\n').map((line, i) => (
              <ClipRevealText
                key={line}
                ref={bind(`nayara.statement.${i}`)}
                className={styles.nayaraStatement}
                text={line}
                trigger="manual"
              />
            ))}
          </span>
        </h2>
        <WordReveal
          ref={bind('nayara.body')}
          as="p"
          className={styles.nayaraBody}
          text={copy.body}
          trigger="manual"
          staggerDelay={0.015}
        />
      </div>

      {/* Motion wraps the chip so it never fights the magnetic pull. */}
      <span className={styles.nayaraCta} data-motion="cta">
        <SigilChip href={copy.cta.href}>{copy.cta.label}</SigilChip>
      </span>
    </section>
  );
}
