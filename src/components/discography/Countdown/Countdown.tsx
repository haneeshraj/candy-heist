import type { DiscographyCopy } from '@/content/discography/discography';
import type { timeLeft } from '@/lib/discography/format';
import styles from './Countdown.module.scss';

interface CountdownProps {
  left: ReturnType<typeof timeLeft>;
  copy: DiscographyCopy['release']['countdown'];
  /** 'page' for a release page (44), 'card' for the share card (36). */
  size?: 'page' | 'card';
  className?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

// Figma "Release · … — forthcoming": the days, hours, minutes and seconds
// to go, each over its label, with hairlines between. Read out once, as
// the days to go; the ticking figures are for the eye.
export default function Countdown({
  left,
  copy,
  size = 'page',
  className
}: CountdownProps) {
  const cells: Array<[number, string]> = [
    [left.days, copy.days],
    [left.hours, copy.hours],
    [left.minutes, copy.minutes],
    [left.seconds, copy.seconds]
  ];
  return (
    <div
      className={
        className ? `${styles.countdown} ${className}` : styles.countdown
      }
      data-size={size}
    >
      <p className={styles.srOnly}>
        {copy.label} {left.days} {copy.days.toLowerCase()}
      </p>
      <ol className={styles.cells} aria-hidden="true">
        {cells.map(([n, label]) => (
          <li key={label} className={styles.cell}>
            <span className={styles.number}>{pad(n)}</span>
            <span className={styles.unit}>{label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
