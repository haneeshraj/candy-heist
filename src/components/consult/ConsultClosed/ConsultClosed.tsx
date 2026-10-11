import Link from 'next/link';
import { VortexMark } from '@/components/common/VortexMark';
import styles from './ConsultClosed.module.scss';
import type { ConsultClosedProps } from './ConsultClosed.types';

// What a feedback link shows once it has closed, or if it never was one:
// the same words either way, since which of the two is nobody's business.
export default function ConsultClosed({ copy }: ConsultClosedProps) {
  return (
    <main className={styles.screen}>
      <div className={styles.card}>
        <Link className={styles.logo} href="/">
          <VortexMark className={styles.logoMark} />
          <span className={styles.srOnly}>{copy.home}</span>
        </Link>
        <h1 className={styles.headline}>{copy.headline}</h1>
        <p className={styles.text}>{copy.text}</p>
      </div>
    </main>
  );
}
