import { useId } from 'react';
import { WordReveal } from '@/components/common/WordReveal';
import type { MeetOn } from '@/lib/booking/bookingState';
import styles from './DetailsStep.module.scss';
import type { MeetOnSwitchProps } from './DetailsStep.types';

const CHOICES: MeetOn[] = ['meet', 'discord'];

// Where a session meets (Figma "Meet on"): Google Meet or Discord, as one
// bordered switch. The gilt block slides to the side that's picked, and the
// line under it says what happens next, rising in again on each change.
// Real radio inputs, so it arrow-keys like a group.
export default function MeetOnSwitch({
  copy,
  value,
  onChange
}: MeetOnSwitchProps) {
  const name = useId();
  const labelId = useId();
  const help = value === 'discord' ? copy.helpDiscord : copy.helpMeet;

  return (
    <div className={styles.meetOn}>
      <p id={labelId} className={styles.meetOnLabel}>
        {copy.label}
        <span className={styles.star} aria-hidden="true">
          {' '}
          *
        </span>
      </p>
      <div
        className={styles.switch}
        role="radiogroup"
        aria-labelledby={labelId}
        data-value={value}
      >
        <span className={styles.switchBlock} aria-hidden="true" />
        {CHOICES.map((choice) => (
          <label key={choice} className={styles.segment}>
            <input
              type="radio"
              name={name}
              value={choice}
              checked={value === choice}
              onChange={() => onChange(choice)}
              className={styles.srOnly}
            />
            {choice === 'meet' ? copy.meet : copy.discord}
          </label>
        ))}
      </div>
      <p className={styles.help} aria-live="polite">
        <WordReveal
          key={help}
          text={help}
          trigger="mount"
          staggerDelay={0.02}
        />
      </p>
    </div>
  );
}
