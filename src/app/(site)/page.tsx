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
import { sessionsContent } from '@/content/home/sessions';
import { testimonialsContent } from '@/content/home/testimonials';
import styles from './page.module.scss';

export default async function Home() {
  const { shelf } = await getCatalogue();
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <LandingHero />
        <AboutSection content={aboutContent} />
        <SessionsSection content={sessionsContent} />
        <DiscographySection content={discographyContentFor(shelf)} />
        <TestimonialsSection content={testimonialsContent} />
        <ContactSection content={contactContent} />
      </main>
    </div>
  );
}
