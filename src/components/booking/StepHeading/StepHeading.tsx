import { ClipRevealText } from '@/components/common/ClipRevealText';
import { WordReveal } from '@/components/common/WordReveal';
import { SigilIcon } from '@/components/icons';
import styles from './StepHeading.module.scss';
import type { StepHeadingProps } from './StepHeading.types';

// "✦ DATE & TIME", the step's question, and a line under it. The label
// wipes in, then the heading and the line rise word by word.
export default function StepHeading({
  label,
  heading,
  sub,
  id,
  trigger = 'mount',
  delay = 0
}: StepHeadingProps) {
  return (
    <header className={styles.heading}>
      <p className={styles.label}>
        <span className={styles.sigil} data-enter>
          <SigilIcon />
        </span>
        <span className={styles.srOnly}>{label}</span>
        <span aria-hidden="true">
          <ClipRevealText
            text={label}
            trigger={trigger}
            startDelay={delay}
            wipeColor="var(--color-gilt)"
          />
        </span>
      </p>
      <h2 id={id} className={styles.title}>
        <WordReveal text={heading} trigger={trigger} startDelay={delay + 0.2} />
      </h2>
      {sub ? (
        <WordReveal
          as="p"
          className={styles.sub}
          text={sub}
          trigger={trigger}
          startDelay={delay + 0.45}
          staggerDelay={0.02}
        />
      ) : null}
    </header>
  );
}
