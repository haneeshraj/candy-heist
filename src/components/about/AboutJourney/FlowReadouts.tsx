import type { AboutReadout } from '@/content/about/about';
import styles from './AboutJourney.module.scss';

// The instrument's readouts as a plain list under the still orb, for
// phones and reduced motion, where the orb doesn't carry them.
export default function FlowReadouts({
  readouts
}: {
  readouts: AboutReadout[];
}) {
  return (
    <ul className={styles.flowReadouts}>
      {readouts.map((readout) => (
        <li
          key={readout.label}
          className={styles.flowReadout}
          data-motion="flow-readout"
        >
          <span className={styles.readoutKey}>{readout.label}</span>
          <span className={styles.readoutValue}>{readout.value}</span>
          <span className={styles.readoutDetail}>{readout.detail}</span>
        </li>
      ))}
    </ul>
  );
}
