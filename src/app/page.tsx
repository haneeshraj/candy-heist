import { AboutSection } from '@/components/landing/AboutSection';
import { LandingHero } from '@/components/landing/LandingHero';
import { aboutContent } from '@/content/home/about';
import styles from './page.module.scss';

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <LandingHero />
        <AboutSection content={aboutContent} />
      </main>
    </div>
  );
}
