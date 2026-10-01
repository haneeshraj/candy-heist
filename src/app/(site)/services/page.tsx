import type { Metadata } from 'next';
import { ServicesPage } from '@/components/services/ServicesPage';
import { servicesPageContent } from '@/content/services/services';

export const metadata: Metadata = servicesPageContent.meta;

// The services page: a door to commissions, to sessions, and to sounds and
// presets (coming soon). The copy is handed over from here so a
// server-side loader can replace it later.
export default function ServicesRoute() {
  return (
    <main>
      <ServicesPage content={servicesPageContent} />
    </main>
  );
}
