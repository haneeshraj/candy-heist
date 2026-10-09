import { AboutSection } from '@/components/landing/AboutSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { DiscographySection } from '@/components/landing/DiscographySection';
import { LandingHero } from '@/components/landing/LandingHero';
import { SessionsSection } from '@/components/landing/SessionsSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { aboutContent } from '@/content/home/about';
import { contactContent } from '@/content/home/contact';
import { getCatalogue } from '@/content/discography/getCatalogue';
import { discographyContentFor } from '@/content/home/discography';
import { sessionsContentFor } from '@/content/home/sessions';
import { testimonialsContentFor } from '@/content/home/testimonials';
import { getServices } from '@/content/services/getServices';
import styles from './page.module.scss';

export default async function Home() {
  const [{ shelf }, { items }] = await Promise.all([
    getCatalogue(),
    getServices()
  ]);
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <LandingHero />
        <AboutSection content={aboutContent} />
        <SessionsSection content={sessionsContentFor(items)} />
        <DiscographySection content={discographyContentFor(shelf)} />
        <TestimonialsSection content={testimonialsContentFor(items)} />
        <ContactSection content={contactContent} />
      </main>
    </div>
  );
}
