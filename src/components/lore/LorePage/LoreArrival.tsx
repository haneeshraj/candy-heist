'use client';

import { ClipRevealText } from '@/components/common/ClipRevealText';
import { NayaraPlanet } from '@/components/common/NayaraPlanet';
import { WordReveal } from '@/components/common/WordReveal';
import type { LoreCopy, PlanetState } from '@/content/lore/lore';
import { SigilIcon } from '@/components/icons';
import styles from './LorePage.module.scss';

interface LoreArrivalProps {
  copy: LoreCopy['intro'];
  headingId: string;
  /** The first chapter's look, for the still planet on phones. */
  look: PlanetState;
}

// Figma "Lore A · 0": the planet alone with the line. On desktop the
// orrery behind is the planet; scrolling on draws the orbit in (A1).
export default function LoreArrival({
  copy,
  headingId,
  look
}: LoreArrivalProps) {
  const lines = copy.statement.split('\n');

  return (
    <header className={styles.arrival} data-motion="arrival">
      <div className={styles.frame}>
        <p className={styles.arrivalLabel}>
          <span className={styles.sigil}>
            <SigilIcon />
          </span>
          {copy.label}
        </p>

        <div className={styles.arrivalFigure}>
          <NayaraPlanet layers={[{ state: look }]} />
        </div>

        <h1 id={headingId} className={styles.arrivalHeading}>
          <span className={styles.srOnly}>
            {copy.lead} {lines.join(' ')}
          </span>
          <span className={styles.headingVisual} aria-hidden="true">
            <WordReveal
              className={styles.lead}
              text={copy.lead}
              trigger="mount"
              startDelay={0.3}
              staggerDelay={0.08}
            />
            <span className={styles.statement}>
              {lines.map((line, i) => (
                <ClipRevealText
                  key={line}
                  className={styles.statementLine}
                  text={line}
                  trigger="mount"
                  startDelay={0.55 + i * 0.15}
                />
              ))}
            </span>
          </span>
        </h1>
        <WordReveal
          as="p"
          className={styles.arrivalSub}
          text={copy.sub}
          trigger="mount"
          startDelay={1}
          staggerDelay={0.02}
        />
        <p className={styles.cue} aria-hidden="true">
          {copy.cue}
          <span className={styles.cueLine} />
        </p>
      </div>
    </header>
  );
}
