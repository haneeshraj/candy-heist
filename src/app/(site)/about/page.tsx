import type { Metadata } from 'next';
import { AboutPage } from '@/components/about/AboutPage';
import { aboutContent } from '@/content/about/about';

export const metadata: Metadata = {
  title: 'About · Candy Heist',
  description:
    'Candy Heist: DJ, producer and sound engineer, Kerala-born and Halifax-based. Who he is, the world of Nayara, and how the music is built.'
};

// The About page. Its scroll journey runs client-side in AboutPage; the
// copy is handed over from here so a server-side loader can replace it.
export default function AboutRoute() {
  return (
    <main>
      <AboutPage content={aboutContent} />
    </main>
  );
}
