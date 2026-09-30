import { AboutSection } from '@/components/landing/AboutSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { DiscographySection } from '@/components/landing/DiscographySection';
import { LandingHero } from '@/components/landing/LandingHero';
import { SessionsSection } from '@/components/landing/SessionsSection';
import { aboutContent } from '@/content/home/about';
import { contactContent } from '@/content/home/contact';
import { discographyContent } from '@/content/home/discography';
import { sessionsContent } from '@/content/home/sessions';
import styles from './page.module.scss';

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <LandingHero />
        <AboutSection content={aboutContent} />
        <SessionsSection content={sessionsContent} />
        <DiscographySection content={discographyContent} />
        <ContactSection content={contactContent} />
      </main>
    </div>
  );
}
