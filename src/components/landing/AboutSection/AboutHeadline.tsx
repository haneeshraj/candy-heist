import styles from './AboutSection.module.scss';
import type { AboutHeadlineProps } from './AboutSection.types';

// One visual half of the mirrored headline. Hidden from assistive tech:
// the section's visually-hidden <h2> reads both halves as one sentence.
export default function AboutHeadline({ half, side }: AboutHeadlineProps) {
  return (
    <p
      className={styles.headline}
      data-side={side}
      data-motion={`head-${side}`}
      aria-hidden="true"
    >
      <span className={styles.headlineLead}>{half.lead}</span>
      <span className={styles.headlineStatement}>{half.statement}</span>
    </p>
  );
}
