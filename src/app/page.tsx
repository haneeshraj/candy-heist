import { LandingHero } from '@/components/landing/LandingHero';
import styles from './page.module.scss';

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <LandingHero />
      </main>
    </div>
  );
}
